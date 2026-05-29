import React from "react";
import { IoClose } from "react-icons/io5";

const ProductCustomizer = ({
  product,
  previewImageRef,
  selectedImageIndex,
  setSelectedImageIndex,
  overlayImage,
  setOverlayImage,
  overlaySize,
  setOverlaySize,
  overlayPosition,
  setOverlayPosition,
  handleOverlayMove,
  handleOverlayTouchStart,
  handleOverlayTouchMove,
  handleOverlayTouchEnd,
  text,
  setText,
  textColor,
  setTextColor,
  textSize,
  setTextSize,
  textPosition,
  setTextPosition,
  handleTextMove,
  handleTextTouchStart,
  handleTextTouchMove,
  handleTextTouchEnd,
  handleDownload,
  handlePlaceCustomizedOrder,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-4 overflow-y-auto py-8">
      <div className="bg-white p-6 rounded-md max-w-5xl w-full relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 cursor-pointer"
        >
          <IoClose size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">
          Product Customization
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left - Preview */}
          <div className="relative border bg-gray-50 rounded-lg p-4 h-[66vh] flex flex-col justify-between">
            <div className="relative flex-1 flex justify-center items-center overflow-hidden">
              <img
                ref={previewImageRef}
                src={product.images[selectedImageIndex]}
                alt="preview"
                className="w-full h-full object-contain pointer-events-none"
              />
              {overlayImage && (
                <img
                  src={overlayImage}
                  draggable
                  onDragEnd={handleOverlayMove}
                  onTouchStart={handleOverlayTouchStart}
                  onTouchMove={handleOverlayTouchMove}
                  onTouchEnd={handleOverlayTouchEnd}
                  className="absolute object-contain cursor-move touch-none"
                  style={{
                    width: overlaySize,
                    height: overlaySize,
                    top: overlayPosition.y,
                    left: overlayPosition.x,
                  }}
                />
              )}
              {text && (
                <span
                  draggable
                  onDragEnd={handleTextMove}
                  onTouchStart={handleTextTouchStart}
                  onTouchMove={handleTextTouchMove}
                  onTouchEnd={handleTextTouchEnd}
                  className="absolute font-bold cursor-move touch-none break-words text-center"
                  style={{
                    color: textColor,
                    fontSize: `${textSize}px`,
                    top: textPosition.y,
                    left: textPosition.x,
                  }}
                >
                  {text}
                </span>
              )}
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="flex gap-2 justify-center ">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`thumb-${idx}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 border p-1 rounded-lg cursor-pointer object-contain transition-all duration-200 ${
                      selectedImageIndex === idx
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right - Controls */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">Upload Image Overlay</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setOverlayImage(URL.createObjectURL(e.target.files[0]))
              }
              className="border w-full p-2 rounded cursor-pointer"
            />

            <label className="block text-sm font-medium">Resize Image</label>
            <input
              type="range"
              min="50"
              max="300"
              value={overlaySize}
              onChange={(e) => setOverlaySize(+e.target.value)}
              className="w-full h-1 bg-primary rounded-lg appearance-none slider-thumb"
            />

            <label className="block text-sm font-medium">Add Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your text"
              className="border w-full p-2 rounded"
            />

            <label className="block text-sm font-medium">Text Size</label>
            <input
              type="range"
              min="10"
              max="100"
              value={textSize}
              onChange={(e) => setTextSize(+e.target.value)}
              className="w-full h-1 bg-primary rounded-lg appearance-none slider-thumb"
            />

            <div className="flex items-center gap-4 mt-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm">{textColor}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center gap-3 pt-4 w-full">
              <button
                onClick={onClose}
                className="px-4 py-2 w-full md:w-auto border border-gray-400 text-gray-700 rounded-md hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              {/* <button
                onClick={handleDownload}
                className="px-4 py-2 w-full md:w-auto bg-primary/90 text-white rounded-md hover:bg-primary transition shadow cursor-pointer"
              >
                Download Only
              </button> */}
              <button
                onClick={handlePlaceCustomizedOrder}
                className="px-4 py-2 w-full md:w-auto bg-orange-600 text-white rounded-md hover:bg-orange-700 transition shadow cursor-pointer"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCustomizer;
