import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoDownloadOutline, IoCartOutline } from 'react-icons/io5';
import { IText, Rect, Circle, Triangle, FabricImage } from 'fabric';
import { AuthContext } from '../Context/AuthContext';
import SidebarTools from './SidebarTools';
import CanvasWorkspace from './CanvasWorkspace';
import PropertiesPanel from './PropertiesPanel';
import { flattenVariantImages } from '../Products/helpers';

const CustomizerLayout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, addToCart } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [viewStates, setViewStates] = useState({});
  const [selectedProductColor, setSelectedProductColor] = useState('#ffffff');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const productImages = useMemo(() => {
    if (!product) return [];

    const normalizeImageArray = (images) => {
      if (!images) return [];
      if (Array.isArray(images)) return images.filter(Boolean);
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
          return images.split(',').map((item) => item.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const primaryImages = normalizeImageArray(product.images);
    if (primaryImages.length > 0) {
      return primaryImages;
    }

    return flattenVariantImages(product.images_by_variant);
  }, [product]);

  useEffect(() => {
    if (productImages.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [productImages]);

  useEffect(() => {
    if (products && products.length > 0) {
      const found = products.find(p => `${p.product_id || p.productId || p.id}` === productId);
      setProduct(found);
    }
  }, [productId, products]);

  useEffect(() => {
    if (location?.state?.selectedColor) {
      setSelectedProductColor(location.state.selectedColor);
    }
    if (location?.state?.selectedImageIndex !== undefined) {
      setSelectedImageIndex(location.state.selectedImageIndex);
    }
  }, [location?.state?.selectedColor, location?.state?.selectedImageIndex]);

  useEffect(() => {
    if (!canvas) return;
    
    const handleSelection = () => {
      setActiveObject(canvas.getActiveObject());
    };
    
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelection);

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelection);
    };
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    canvas.setZoom(zoomLevel);
    canvas.requestRenderAll();
  }, [canvas, zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.4));
  };

  if (!product) {
    return <div className="h-screen w-full bg-gray-900 text-white flex items-center justify-center">Loading product...</div>;
  }

  // Handlers for Canvas
  const handleAddText = (type = 'heading') => {
    if (!canvas) return;
    
    const sizes = { heading: 40, subheading: 24, body: 16 };
    const text = new IText('Double click to edit', {
      left: Math.random() * 50 + 50,
      top: Math.random() * 50 + 50,
      fontFamily: 'Arial',
      fill: '#000000',
      fontSize: sizes[type] || 24,
      fontWeight: type === 'heading' ? 'bold' : 'normal',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  };

  const handleAddShape = (type) => {
    if (!canvas) return;
    
    let shape;
    const opts = { left: 80, top: 80, fill: '#4f46e5' };
    if (type === 'rect') shape = new Rect({ ...opts, width: 80, height: 80 });
    else if (type === 'circle') shape = new Circle({ ...opts, radius: 40 });
    else if (type === 'triangle') shape = new Triangle({ ...opts, width: 80, height: 80 });
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;
    
    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target.result;
      try {
        const img = await FabricImage.fromURL(data);
        img.scaleToWidth(150);
        img.set({ left: 50, top: 50 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      } catch (err) {
        console.error("Upload error:", err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null; // Reset input
  };

  const handleChangeColor = (e) => {
    if (!activeObject || !canvas) return;
    activeObject.set({ fill: e.target.value });
    canvas.requestRenderAll();
    // Force state update to re-render the color picker value
    setActiveObject(canvas.getActiveObject());
  };

  const views = ['Front View', 'Back View', 'Left Sleeve', 'Right Sleeve', 'Neck Label'];

  const handleViewChange = (idx) => {
    if (idx === currentViewIndex) return;
    
    if (canvas) {
      // Save current state including custom properties like 'id'
      const currentState = canvas.toJSON(['id', 'selectable', 'evented']);
      setViewStates(prev => ({ ...prev, [currentViewIndex]: currentState }));
      
      // Load new state
      if (viewStates[idx]) {
        canvas.loadFromJSON(viewStates[idx], () => {
          canvas.requestRenderAll();
        });
      } else {
        // Clear canvas but keep clipPath
        canvas.getObjects().forEach(obj => {
          if (obj.id !== 'clip-path') {
            canvas.remove(obj);
          }
        });
        canvas.requestRenderAll();
      }
    }
    
    setCurrentViewIndex(idx);
  };

  const handlePlaceOrder = async () => {
    if (!product) return;
    
    let customizedImage = product.images?.[0];
    if (canvas) {
      try {
        customizedImage = canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2 // High res
        });
      } catch (err) {
        console.error("Canvas export error:", err);
      }
    }

    const customizedProduct = {
      ...product,
      customizedImage,
      isCustomized: true,
      selectedSize: 'M', // Defaulting for now
      selectedColor: selectedProductColor,
      quantity: 1,
      price: product.salePrice || product.price || 0,
    };

    navigate('/checkout', { 
      state: { 
        buyNowProduct: customizedProduct, 
        fromCart: false 
      } 
    });
  };

  const handleSave = () => {
    if (!canvas) return;
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `CustomDesign_${product?.name || productId}_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Save export error:", err);
      alert("Could not save image due to security restrictions on external images.");
    }
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-auto min-h-[3.5rem] border-b border-gray-800 bg-gray-950 flex flex-wrap items-center justify-between px-2 md:px-4 py-2 shrink-0 gap-y-2">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 md:p-2 hover:bg-gray-800 rounded-full transition"
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-xs md:text-sm font-semibold tracking-wide">
            <span className="hidden sm:inline">Product Customizer</span>
            <span className="sm:hidden">Customizer</span>
            <span className="text-gray-500 font-normal ml-1">| {productId}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs md:text-sm font-medium mr-1 md:mr-4">₹{product.salePrice || product.price || 0}</span>
          <button onClick={handleSave} className="px-2 md:px-4 py-1.5 text-xs md:text-sm font-medium border border-gray-700 hover:bg-gray-800 rounded transition flex items-center gap-1 md:gap-2 cursor-pointer">
            <IoDownloadOutline size={16} /> <span className="hidden md:inline">Save</span>
          </button>
          <button onClick={handlePlaceOrder} className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition flex items-center gap-1 md:gap-2 cursor-pointer">
            <IoCartOutline size={16} /> <span className="hidden sm:inline">Place Order</span><span className="sm:hidden">Order</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Mobile: Sidebar tools at bottom. Desktop: left */}
        <div className="order-3 md:order-1 shrink-0 z-30 bg-gray-950">
          <SidebarTools activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Expanded Tool Panel */}
        <div className={`order-2 md:order-2 w-full md:w-80 ${activeTab ? 'h-64' : 'h-0 hidden'} md:h-full md:flex bg-gray-900 border-t md:border-t-0 border-b md:border-b-0 md:border-r border-gray-800 p-6 overflow-y-auto z-20 flex-col shadow-2xl relative shrink-0 transition-all`}>
          <h2 className="text-xl font-bold mb-6 capitalize tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{activeTab}</h2>
          
          {activeTab === 'templates' && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 cursor-pointer overflow-hidden group relative">
                  <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Template {i}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'uploads' && (
             <div className="flex flex-col gap-4">
                <label className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-indigo-400">
                  <span className="text-2xl mb-2">📁</span>
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
                <p className="text-xs text-gray-400 text-center">Supports JPG, PNG, SVG</p>
             </div>
          )}

          {activeTab === 'text' && (
             <div className="flex flex-col gap-4">
                <button onClick={() => handleAddText('heading')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all">Add a heading</button>
                <button onClick={() => handleAddText('subheading')} className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium border border-gray-700 transition-all">Add a subheading</button>
                <button onClick={() => handleAddText('body')} className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm border border-gray-700 transition-all">Add a little bit of body text</button>
             </div>
          )}

          {activeTab === 'elements' && (
             <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleAddShape('rect')} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 flex items-center justify-center transition-all group">
                   <div className="w-10 h-10 bg-gray-500 group-hover:bg-indigo-500 transition-colors rounded-sm"></div>
                </button>
                <button onClick={() => handleAddShape('circle')} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 flex items-center justify-center transition-all group">
                   <div className="w-10 h-10 bg-gray-500 group-hover:bg-indigo-500 transition-colors rounded-full"></div>
                </button>
                <button onClick={() => handleAddShape('triangle')} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 flex items-center justify-center transition-all group">
                   <div className="w-0 h-0 border-l-[20px] border-l-transparent border-b-[35px] border-b-gray-500 group-hover:border-b-indigo-500 border-r-[20px] border-r-transparent transition-colors"></div>
                </button>
             </div>
          )}

          {activeTab !== 'templates' && activeTab !== 'text' && activeTab !== 'elements' && activeTab !== 'uploads' && (
            <div className="flex-1 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-sm text-gray-500 p-6 text-center">
              <span className="mb-2 text-2xl opacity-50">✨</span>
              <p>More tools coming soon.</p>
            </div>
          )}

          {/* Properties Panel (Shows when an object is selected) */}
          <PropertiesPanel 
            activeObject={activeObject} 
            canvas={canvas} 
            setActiveObject={setActiveObject} 
          />
        </div>

        {/* Canvas Workspace */}
        <div className="order-1 md:order-3 flex-1 bg-gray-900 relative flex flex-col items-center justify-center overflow-hidden md:overflow-auto p-4 md:p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTIwIDBoLTIwdjIwaDIweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xOSAxOUgxVjFoMTh2MTh6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTIwIDBoLTF2MTloLTE5djFoMjB6IiBmaWxsPSIjMjIyMjIyIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]">
          
          {/* Product Color Picker Overlay */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl p-2 md:p-4 flex flex-col gap-2 md:gap-3 shadow-lg z-20 scale-90 md:scale-100 origin-top-right">
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Color</h3>
             <div className="flex flex-wrap max-w-[140px] gap-2">
                {((product?.color && product.color.length > 0) ? product.color : ['#ffffff', '#000000', '#f87171', '#60a5fa', '#34d399', '#fbbf24']).map((color, idx) => {
                  // If color is a string, handle it. Some APIs return an object, we assume string.
                  const colorVal = typeof color === 'string' ? color : (color.hex || color.name || '#ffffff');
                  return (
                  <button
                    key={idx}
                    onClick={() => setSelectedProductColor(colorVal)}
                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${selectedProductColor === colorVal ? 'border-indigo-500 scale-110' : 'border-gray-700'}`}
                    style={{ backgroundColor: colorVal }}
                    title={colorVal}
                  />
                )})}
             </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <CanvasWorkspace 
              key={productImages[selectedImageIndex] || product.images?.[0] || 'customizer'}
              product={product} 
              imageSrc={productImages[selectedImageIndex] || product.images?.[0]}
              selectedProductColor={selectedProductColor}
              onCanvasReady={(c) => setCanvas(c)} 
            />

            {productImages.length > 1 && (
              <div className="w-full overflow-x-auto py-2 px-1 flex gap-2 justify-center items-center">
                {productImages.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`border rounded-lg overflow-hidden ${selectedImageIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-gray-700'} shrink-0`}
                    style={{ width: 72, height: 72 }}
                  >
                    <img
                      src={src}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Bottom Zoom/View Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full px-2 md:px-4 py-1 md:py-2 flex items-center gap-2 md:gap-4 shadow-lg scale-90 md:scale-100 whitespace-nowrap z-20 overflow-x-auto max-w-[90vw] custom-scrollbar">
             <button onClick={handleZoomOut} className="text-gray-300 hover:text-white px-2 py-1 rounded-full bg-gray-800/80 hover:bg-gray-700 transition">-</button>
             <span className="text-sm font-medium w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
             <button onClick={handleZoomIn} className="text-gray-300 hover:text-white px-2 py-1 rounded-full bg-gray-800/80 hover:bg-gray-700 transition">+</button>
             <div className="w-px h-4 bg-gray-700 shrink-0"></div>
              {views.map((viewName, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleViewChange(idx)}
                  className={`text-sm whitespace-nowrap ${currentViewIndex === idx ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {viewName}
                </button>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomizerLayout;
