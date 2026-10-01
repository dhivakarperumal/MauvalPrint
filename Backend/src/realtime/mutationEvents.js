const RESOURCE_NAMES = new Set([
  "users",
  "products",
  "categories",
  "orders",
  "print-orders",
  "reviews",
  "dealers",
  "invoices",
  "keywords",
  "wishlist",
  "cart",
  "videos",
  "logos",
  "logo-cart",
]);

const toEventResource = (resource) => resource.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const sanitize = (value, depth = 0) => {
  if (depth > 4 || value == null || typeof value !== "object") {
    return typeof value === "string" && value.length > 5000 ? undefined : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1)).filter((item) => item !== undefined);
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (/password|token|secret|authorization/i.test(key)) return [];
      const sanitized = sanitize(item, depth + 1);
      if (sanitized === undefined || (Array.isArray(item) && item.length > 0 && sanitized.length === 0)) return [];
      return [[key, sanitized]];
    })
  );
};

const createMutationEventMiddleware = (app) => (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  const pathParts = req.originalUrl.split("?")[0].split("/").filter(Boolean);
  if (pathParts[0] !== "api" || !RESOURCE_NAMES.has(pathParts[1])) return next();

  const resource = pathParts[1];
  if (resource === "users" && ["login", "google-login"].includes(pathParts[2])) {
    return next();
  }
  const isUserAddressMutation = resource === "users" && pathParts[3] === "addresses";
  const eventResource = isUserAddressMutation ? "userAddresses" : toEventResource(resource);
  const isDelete = req.method === "DELETE";
  const privateItemResource = ["cart", "wishlist", "logo-cart"].includes(resource);
  const isClear = isDelete && privateItemResource && pathParts[2] === "clear";
  const action = isDelete ? "deleted" : req.method === "POST" ? "created" : "updated";
  const payloadBeforeWrite = req.body || {};
  const resourceId =
    (isClear ? pathParts[3] : null) ||
    (privateItemResource && isDelete && pathParts[2] !== "clear" ? pathParts[3] : null) ||
    (isUserAddressMutation && pathParts[4] ? pathParts[4] : null) ||
    (!privateItemResource && !["web-checkout", "add", "update", "clear", "bulk-assign"].includes(pathParts[2]) ? pathParts[2] : null) ||
    payloadBeforeWrite.order_id ||
    payloadBeforeWrite.product_id ||
    payloadBeforeWrite.productId ||
    payloadBeforeWrite.id ||
    null;
  let ownerId =
    payloadBeforeWrite.userId ||
    payloadBeforeWrite.user_id ||
    (privateItemResource ? (pathParts[2] === "clear" ? pathParts[3] : pathParts[2]) : null) ||
    (resource === "users" ? pathParts[2] : null);

  const existingOwner = resource === "orders" && resourceId
    ? app.locals.pool.query("SELECT user_id FROM orders WHERE order_id = ? LIMIT 1", [resourceId])
        .then(([rows]) => rows[0]?.user_id || null)
        .catch(() => null)
    : Promise.resolve(null);

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const response = sendJson(body);
    if (res.statusCode < 200 || res.statusCode >= 300 || body?.success === false) return response;

    void existingOwner.then((previousOwnerId) => {
      const io = app.get("io");
      if (!io) return;

      const id = body?.order_id || body?.address_id || body?.id || body?.product_id || body?.productId || body?.logo_id || body?.logoId || body?.category_id || body?.review_id || body?.video?.video_id || body?.data?.user_id || resourceId;
      const emitEvent = (record, targetUserId = ownerId || previousOwnerId) => {
        const event = {
          resource: eventResource,
          action,
          id: id || null,
          data: sanitize(isClear ? { ...record, clearAll: true } : record),
          query: isDelete ? sanitize(req.query) : undefined,
        };
        const rooms = new Set();
        if (["products", "categories", "keywords", "reviews", "videos", "logos"].includes(resource)) {
          rooms.add("role:user");
          rooms.add("role:admin");
        } else if (["cart", "wishlist", "logoCart", "userAddresses"].includes(eventResource)) {
          if (ownerId) rooms.add(`user:${ownerId}`);
        } else if (["orders", "print-orders", "users"].includes(resource)) {
          rooms.add("role:admin");
          if (targetUserId) rooms.add(`user:${targetUserId}`);
        } else {
          rooms.add("role:admin");
        }

        if (!rooms.size) return;
        const targets = [...rooms];
        io.to(targets).emit(`data:${action}`, event);
        if (resource === "orders" || resource === "print-orders") {
          io.to(targets).emit("order:updated", event);
          if (resource === "orders" && action === "created") {
            io.to("role:admin").emit("notification:new", {
              type: "order",
              id: event.id,
              message: `New order ${event.id}`,
              data: event.data,
            });
          }
          if (resource === "orders" && event.data?.payment_id) {
            io.to(targets).emit("payment:updated", event);
          }
        }
        if (resource === "products") {
          io.to(targets).emit("product:updated", event);
          if (/stock|reduce-stock/.test(req.originalUrl)) io.to(targets).emit("stock:updated", event);
        }
      };

      const record = body?.[resource] || body?.[eventResource] || body?.data || payloadBeforeWrite;
      if (resource === "keywords" && pathParts[2] === "bulk-assign" && Array.isArray(payloadBeforeWrite.productIds)) {
        void Promise.all(payloadBeforeWrite.productIds.map((productId) =>
          app.locals.pool.query("SELECT * FROM products WHERE product_id = ? LIMIT 1", [productId])
        )).then((results) => {
          for (const [rows] of results) {
            if (!rows[0]) continue;
            const product = rows[0];
            if (typeof product.keywords === "string") {
              try {
                product.keywords = JSON.parse(product.keywords);
              } catch {
                product.keywords = [];
              }
            }
            const event = { resource: "products", action: "updated", id: product.product_id, data: sanitize(product) };
            io.to(["role:user", "role:admin"]).emit("data:updated", event);
            io.to(["role:user", "role:admin"]).emit("product:updated", event);
          }
        }).catch((error) => console.error("Could not read bulk-updated products for realtime event:", error.message));
        return;
      }

      if (resource === "orders" && id && action !== "deleted") {
        void app.locals.pool.query("SELECT * FROM orders WHERE order_id = ? LIMIT 1", [id])
          .then(([rows]) => {
            if (!rows[0]) return emitEvent(record);
            const order = rows[0];
            for (const key of ["checkout", "cart"]) {
              if (typeof order[key] !== "string") continue;
              try {
                order[key] = JSON.parse(order[key]);
              } catch {
                order[key] = key === "cart" ? [] : {};
              }
            }
            emitEvent(order, order.user_id || previousOwnerId);
          })
          .catch((error) => console.error("Could not read saved order for realtime event:", error.message));
        return;
      }

      if (resource === "products" && id && action !== "deleted") {
        void app.locals.pool.query("SELECT * FROM products WHERE product_id = ? LIMIT 1", [id])
          .then(([rows]) => {
            if (!rows[0]) return emitEvent(record);
            const product = rows[0];
            for (const key of ["images", "images_by_variant", "stock_by_variant", "fabric_gsm", "keywords", "washing_details", "color", "size", "size_charts", "price_by_type"]) {
              if (typeof product[key] !== "string") continue;
              try {
                product[key] = JSON.parse(product[key]);
              } catch {
                product[key] = key === "images" || key === "color" || key === "size" ? [] : {};
              }
            }
            emitEvent(product);
          })
          .catch((error) => console.error("Could not read saved product for realtime event:", error.message));
        return;
      }

      emitEvent(record, body?.data?.user_id || ownerId || previousOwnerId);
    });

    return response;
  };

  next();
};

module.exports = { createMutationEventMiddleware };