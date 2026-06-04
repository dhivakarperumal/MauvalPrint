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

  const loadProductImage = (canvas, src) => {
    if (!canvas || !src) return;

    const existing = canvas.getObjects().find((obj) => obj.id === 'product-image');
    if (existing) {
      canvas.remove(existing);
    }

    const imgEl = new window.Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      const img = new FabricImage(imgEl, {
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        cornerStyle: 'circle',
        cornerStrokeColor: '#4f46e5',
        borderColor: '#818cf8',
        cornerSize: 10,
        transparentCorners: false,
        opacity: 0.95,
        id: 'product-image',
      });
      const scale = Math.min(250 / img.width, 350 / img.height, 1);
      img.scale(scale);
      img.left = (250 - img.getScaledWidth()) / 2;
      img.top = (350 - img.getScaledHeight()) / 2;
      canvas.add(img);
      img.sendToBack();
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    };
    imgEl.onerror = () => {
      console.error('Canvas image failed to load:', src);
    };
    imgEl.src = src;
  };

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
    loadProductImage(fabricCanvas, proxiedImageSrc);
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
