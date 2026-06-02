import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect } from 'fabric';

const CanvasWorkspace = ({ onCanvasReady, product, imageSrc, selectedProductColor }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);

  useEffect(() => {
    // Initialize Fabric Canvas
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 250,
      height: 350,
      preserveObjectStacking: true,
      selection: true,
    });

    setFabricCanvas(canvas);
    if (onCanvasReady) onCanvasReady(canvas);

    // Mock Printable Boundary
    const clipPath = new Rect({
      width: 250,
      height: 350,
      left: 0,
      top: 0,
      absolutePositioned: true,
      stroke: '#cbd5e1',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      fill: 'transparent',
      selectable: false,
      evented: false,
      id: 'clip-path',
    });
    
    // Allow elements to render over the edge but you can only drag within
    canvas.add(clipPath);

    return () => {
      canvas.dispose();
    };
  }, []);

  const getProxyUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('https://mauvalprint.in/uploads/')) {
      return url.replace('https://mauvalprint.in/uploads/', '/proxy-uploads/');
    }
    return url;
  };
  
  const proxiedImageSrc = getProxyUrl(imageSrc || "https://via.placeholder.com/500x600.png?text=T-Shirt+Mockup");

  return (
    <div className="w-full max-w-[500px] aspect-[5/6] bg-white rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden shrink-0">
      {/* Colored Mask layer */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300 z-0"
        style={{ 
          backgroundColor: selectedProductColor || '#ffffff',
          WebkitMaskImage: `url("${proxiedImageSrc}")`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url("${proxiedImageSrc}")`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />

      {/* Texture/Shadows layer */}
      <img 
        src={proxiedImageSrc} 
        alt={product?.name || "T-Shirt Mockup"} 
        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply pointer-events-none z-0"
      />
      
      {/* Canvas Area (Overlay on the T-shirt print area) */}
      <div 
        className="absolute z-10 border border-dashed border-gray-300"
        style={{
          top: "16%",
          width: "50%",
          height: "58.33%",
          left: "25%"
        }}
      >
        <div className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&>div>canvas]:!w-full [&>div>canvas]:!h-full">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default CanvasWorkspace;
