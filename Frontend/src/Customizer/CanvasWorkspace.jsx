import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect } from 'fabric';

const CanvasWorkspace = ({ onCanvasReady, product, imageSrc }) => {
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

  return (
    <div className="w-[500px] h-[600px] bg-white rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden">
      {/* Background T-Shirt Image (Mocked) */}
      <img 
        src={imageSrc || "https://via.placeholder.com/500x600.png?text=T-Shirt+Mockup"} 
        alt={product?.name || "T-Shirt Mockup"} 
        className="absolute inset-0 w-full h-full object-contain z-0 pointer-events-none transition-opacity duration-300"
      />
      
      {/* Canvas Area (Overlay on the T-shirt print area) */}
      <div className="absolute top-24 z-10 w-[250px] h-[350px] border border-dashed border-gray-300">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasWorkspace;
