const parseObject = (value, fallback) => {
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
  const images = parseObject(product.images, []);
  const imagesByVariant = parseObject(product.images_by_variant || product.imagesByVariant, {});
  const stockByVariant = parseObject(product.stock_by_variant || product.stockByVariant, {});
  const sizeCharts = parseObject(product.size_charts || product.sizeCharts, {});
  const priceByType = parseObject(product.price_by_type || product.priceByType, {});

  const normalized = {
    ...product,
    id: productId,
    product_id: productId,
    productId,
    name: product.name || product.title || product.product_name || "",
    title: product.title || product.name || "",
    salePrice: product.salePrice ?? product.sale_price ?? product.price ?? 0,
    sale_price: product.sale_price ?? product.salePrice ?? product.price ?? 0,
    mrp: product.mrp ?? 0,
    ourDesign: product.ourDesign ?? (product.our_design === true || Number(product.our_design) === 1),
    stockByVariant,
    stock_by_variant: stockByVariant,
    size: parseObject(product.size, []),
    color: parseObject(product.color, []),
    sizeCharts,
    size_charts: sizeCharts,
    priceByType,
    price_by_type: priceByType,
  };

  if (product.images !== undefined) {
    normalized.images = Array.isArray(images) ? images : [];
  }
  if (product.images_by_variant !== undefined || product.imagesByVariant !== undefined) {
    normalized.imagesByVariant = imagesByVariant;
    normalized.images_by_variant = imagesByVariant;
  }
  return normalized;
}
