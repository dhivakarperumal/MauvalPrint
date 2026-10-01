const parseValue = (value, fallback) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function normalizeRealtimeProduct(product, id) {
  const productId = product.product_id || product.productId || product.id || id;
  const normalized = {
    ...product,
    id: productId,
    product_id: productId,
    name: product.name || product.title || product.product_name || "",
    title: product.title || product.name || "",
    salePrice: product.salePrice ?? product.sale_price ?? product.price ?? 0,
    sale_price: product.sale_price ?? product.salePrice ?? product.price ?? 0,
    mrp: product.mrp ?? 0,
    ourDesign: product.ourDesign ?? (product.our_design === true || Number(product.our_design) === 1),
    size: parseValue(product.size, []),
    color: parseValue(product.color, []),
    stockByVariant: parseValue(product.stock_by_variant || product.stockByVariant, {}),
    price_by_type: parseValue(product.price_by_type || product.priceByType, {}),
    size_charts: parseValue(product.size_charts || product.sizeCharts, {}),
  };
  if (product.images !== undefined) normalized.images = parseValue(product.images, []);
  if (product.images_by_variant !== undefined || product.imagesByVariant !== undefined) {
    normalized.images_by_variant = parseValue(product.images_by_variant || product.imagesByVariant, {});
  }
  return normalized;
}