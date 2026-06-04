import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Image as FabricImage } from 'fabric';

const CanvasWorkspace = ({ onCanvasReady, product, imageSrc, selectedProductColor }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);

  const getProxyUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('https://mauvalprint.in/uploads/')) {
      return url.replace('https://mauvalprint.in/uploads/', '/proxy-uploads/');
    }
    return url;
  };

  const proxiedImageSrc = getProxyUrl(imageSrc || "https://via.placeholder.com/500x600.png?text=T-Shirt+Mockup");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 250,
      height: 350,
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: selectedProductColor || '#ffffff',
    });

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

    canvas.add(clipPath);

    FabricImage.fromURL(proxiedImageSrc, (img) => {
      img.set({
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        width: 250,
        height: 350,
        selectable: false,
        evented: false,
        opacity: 0.95,
      });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        originX: 'left',
        originY: 'top',
        width: 250,
        height: 350,
      });
    }, { crossOrigin: 'anonymous' });

    setFabricCanvas(canvas);
    if (onCanvasReady) onCanvasReady(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.set('backgroundColor', selectedProductColor || '#ffffff');
    fabricCanvas.requestRenderAll();
  }, [selectedProductColor, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    FabricImage.fromURL(proxiedImageSrc, (img) => {
      img.set({
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        width: 250,
        height: 350,
        selectable: false,
        evented: false,
        opacity: 0.95,
      });
      fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
        originX: 'left',
        originY: 'top',
        width: 250,
        height: 350,
      });
    }, { crossOrigin: 'anonymous' });
  }, [proxiedImageSrc, fabricCanvas]);

  return (
    <div className="w-full max-w-[500px] aspect-[5/6] rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden shrink-0 bg-white">
      <div className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&>div>canvas]:!w-full [&>div>canvas]:!h-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasWorkspace;
