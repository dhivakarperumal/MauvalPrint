import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Image as FabricImage } from 'fabric';

const CanvasWorkspace = ({ onCanvasReady, product, imageSrc, selectedProductColor, onExportSafeChange }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);

  // Inline SVG placeholder — no external dependency
  const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600"><rect fill="%23f1f5f9" width="500" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="%2394a3b8">T-Shirt Mockup</text></svg>'
  )}`;

  const errorSvg = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600"><rect fill="%23f1f5f9" width="500" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="%23ef4444">Image Not Found</text></svg>'
  )}`;

  // Use the provided imageSrc directly, or fall back to the placeholder
  const displaySrc = imageSrc || placeholderSvg;
  const proxyApiUrl = '/api/proxy-image?url=';
  const viteProxyBase = '/proxy-image';

  const addImageToCanvas = (canvas, imgEl) => {
    try {
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

      // Use canvas method for Fabric.js v6+ compatibility
      if (canvas.sendObjectToBack) {
        canvas.sendObjectToBack(img);
      } else if (img.sendToBack) {
        img.sendToBack();
      }

      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    } catch (err) {
      console.error('Error creating fabric image:', err);
    }
  };

  /**
   * Convert any image URL to a clean data URL that won't taint the canvas.
   * Strategy:
   *  1. Try fetch() as same-origin (works for same-origin / CORS-enabled URLs)
   *  2. Try fetch() via /proxy-image (Vite dev proxy)
   *  3. Fallback: load <img> without crossOrigin, draw to temp canvas to get dataURL
   *     (this works because the temp canvas is throwaway — we only need the pixels)
   */
  const toCleanDataUrl = (src) => {
    return new Promise((resolve, reject) => {
      // data: and blob: are already clean
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        resolve({ src, safe: true });
        return;
      }

      const fetchUrls = [src];
      try {
        const url = new URL(src, window.location.origin);
        if (url.origin !== window.location.origin) {
          fetchUrls.unshift(viteProxyBase + url.pathname + url.search);
          if (backendProxyBase) {
            fetchUrls.unshift(backendProxyBase + encodeURIComponent(src));
          }
        }
      } catch { /* ignore */ }

      const tryFetch = async () => {
        for (const fetchUrl of fetchUrls) {
          try {
            const res = await fetch(fetchUrl);
            if (res.ok) {
              const blob = await res.blob();
              return new Promise((res2) => {
                const reader = new FileReader();
                reader.onloadend = () => res2(reader.result);
                reader.readAsDataURL(blob);
              });
            }
          } catch { /* try next */ }
        }

        if (proxyApiUrl) {
          try {
            const proxyRes = await fetch(proxyApiUrl + encodeURIComponent(src));
            if (proxyRes.ok) {
              const blob = await proxyRes.blob();
              return new Promise((res2) => {
                const reader = new FileReader();
                reader.onloadend = () => res2(reader.result);
                reader.readAsDataURL(blob);
              });
            }
          } catch { /* ignore proxy failure */ }
        }

        return null;
      };

      tryFetch().then((dataUrl) => {
        if (dataUrl) {
          resolve({ src: dataUrl, safe: true });
          return;
        }

        // Strategy 3: Load img without crossOrigin, copy pixels via temp canvas
        const img = new window.Image();
        img.onload = () => {
          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const result = tempCanvas.toDataURL('image/png');
            resolve({ src: result, safe: true });
          } catch {
            resolve({ src, safe: false });
          }
        };
        img.onerror = () => reject(new Error('Image failed to load: ' + src));
        img.src = src;
      }).catch((err) => reject(err));
    });
  };

  const loadProductImage = (canvas, src) => {
    if (!canvas || !src) return;

    const existing = canvas.getObjects().find((obj) => obj.id === 'product-image');
    if (existing) {
      canvas.remove(existing);
    }

    toCleanDataUrl(src)
      .then(({ src: cleanSrc, safe }) => {
        if (onExportSafeChange) {
          onExportSafeChange(safe);
        }
        if (!safe) {
          console.warn('Using original image source for display. Export/save may fail due to CORS/tainted canvas.');
        }

        const imgEl = new window.Image();
        imgEl.onload = () => addImageToCanvas(canvas, imgEl);
        imgEl.onerror = () => {
          console.error('Clean image failed to load');
          if (!src.startsWith('data:')) loadProductImage(canvas, errorSvg);
          else if (onExportSafeChange) onExportSafeChange(true);
        };
        imgEl.src = cleanSrc;
      })
      .catch((err) => {
        console.error('Image conversion failed:', err);
        if (onExportSafeChange) {
          onExportSafeChange(true);
        }
        if (!src.startsWith('data:')) loadProductImage(canvas, errorSvg);
      });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 250,
      height: 350,
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: '#ffffff', // keep workspace background white by default
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

  // Keep the canvas background white so designs remain visible
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.set('backgroundColor', '#ffffff');
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    loadProductImage(fabricCanvas, displaySrc);
  }, [displaySrc, fabricCanvas]);

  return (
    <div className="w-full max-w-[500px] md:aspect-[5/6] h-[300px] md:h-auto rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden shrink-0 bg-white">
      <div className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&>div>canvas]:!w-full [&>div>canvas]:!h-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasWorkspace;
