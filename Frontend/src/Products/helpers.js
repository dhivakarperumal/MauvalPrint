export const isValidImageSrc = (src) => {
  if (!src || typeof src !== 'string') return false;
  return src.startsWith('http') || src.startsWith('/') || src.startsWith('data:');
};

export const flattenVariantImages = (images_by_variant) => {
  if (!images_by_variant || typeof images_by_variant !== 'object') return [];
  return Object.values(images_by_variant).flat().filter(isValidImageSrc);
};

export const pickPrimaryImage = (p) => {
  if (!p) return null;
  if (Array.isArray(p.images) && p.images.length > 0 && isValidImageSrc(p.images[0])) return p.images[0];
  const flat = flattenVariantImages(p.images_by_variant || {});
  return flat.length > 0 ? flat[0] : null;
};
