import React from "react";

const ImagePreviewModal = ({ isOpen, imageSrc, imageName, onClose, onPrint }) => {
  if (!isOpen || !imageSrc) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 bg-gray-900 px-4 py-3 text-white">
          <div>
            <p className="text-sm font-semibold">{imageName || "Preview Image"}</p>
            <p className="text-xs text-gray-300">Click outside or press close to dismiss.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-200 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-4 bg-gray-100 flex justify-center items-center overflow-hidden">
          <img
            src={imageSrc}
            alt={imageName || "Preview"}
            className="max-h-[70vh] w-auto max-w-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row justify-end items-center bg-white p-4 border-t border-gray-200">
          <a
            href={imageSrc}
            download={imageName ? `${imageName.replace(/\s+/g, "_").toLowerCase()}.png` : "order-image.png"}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Download Image
          </a>
          <button
            type="button"
            onClick={() => onPrint(imageSrc)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Print Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
