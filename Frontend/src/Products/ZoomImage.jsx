import React, { useRef, useState, useCallback, memo } from "react";

// Image optimization utility
const optimizeImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('firebaseapp.com')) {
    return `${url}&w=600&q=85`;
  }
  return url;
};

const ZoomImage = memo(({
  imageSrc,
  onImageSelect,
  thumbnails = [],
  selectedImageIndex,
}) => {
  const imageRef = useRef(null);
  const zoomBoxRef = useRef(null);

  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [zoomBackgroundPosition, setZoomBackgroundPosition] =
    useState("50% 50%");
  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomBackgroundPosition(`${x}% ${y}%`);
    setIsZoomVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZoomVisible(false);
  }, []);

  const handleImageSelect = useCallback((idx) => {
    onImageSelect(idx);
    setMainImageLoaded(false);
  }, [onImageSelect]);

  const optimizedImageSrc = optimizeImageUrl(imageSrc);

  return (
    <div className="sticky top-28 rounded-xl shadow p-4 space-y-4 w-full ">
      <div className="relative w-full bg-gray-100 rounded-xl">
        <img
          ref={imageRef}
          src={optimizedImageSrc}
          alt="product"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onLoad={() => setMainImageLoaded(true)}
          className="w-[400px] h-[400px] object-contain rounded-xl hover:cursor-crosshair mx-auto transition-opacity duration-300"
          loading="eager"
          decoding="async"
          width={400}
          height={400}
        />

        {isZoomVisible && (
          <div
            ref={zoomBoxRef}
            className="absolute top-0 left-[110%] hidden md:block w-100 h-100 border border-gray-300 rounded-lg shadow-lg bg-white"
            style={{
              backgroundImage: `url(${optimizedImageSrc})`,
              backgroundSize: "200%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: zoomBackgroundPosition,
            }}
          />
        )}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {thumbnails.map((img, idx) => (
          <img
            key={idx}
            src={optimizeImageUrl(img)}
            alt={`Thumbnail ${idx + 1}`}
            onClick={() => handleImageSelect(idx)}
            className={`w-16 h-16 border p-1 rounded object-contain cursor-pointer transition ${
              selectedImageIndex === idx
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-gray-300"
            }`}
            loading="lazy"
            decoding="async"
            width={64}
            height={64}
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.selectedImageIndex === nextProps.selectedImageIndex &&
    prevProps.imageSrc === nextProps.imageSrc &&
    JSON.stringify(prevProps.thumbnails) === JSON.stringify(nextProps.thumbnails)
  );
});

ZoomImage.displayName = 'ZoomImage';

export default ZoomImage;
