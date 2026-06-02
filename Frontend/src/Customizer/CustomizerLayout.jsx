import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoArrowBack, IoDownloadOutline, IoCartOutline } from 'react-icons/io5';
import { IText, Rect, Circle, Triangle, FabricImage } from 'fabric';
import { AuthContext } from '../Context/AuthContext';
import SidebarTools from './SidebarTools';
import CanvasWorkspace from './CanvasWorkspace';
import PropertiesPanel from './PropertiesPanel';

const CustomizerLayout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, addToCart } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  useEffect(() => {
    if (products && products.length > 0) {
      const found = products.find(p => `${p.product_id || p.productId || p.id}` === productId);
      setProduct(found);
    }
  }, [productId, products]);

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
    reader.onload = (f) => {
      const data = f.target.result;
      const imgElement = new window.Image();
      imgElement.src = data;
      imgElement.onload = () => {
        const img = new FabricImage(imgElement);
        img.scaleToWidth(150);
        img.set({ left: 50, top: 50 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      };
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

  const views = ['Front View', 'Back View', 'Left Sleeve', 'Right Sleeve'];

  const handleAddToCart = () => {
    if (!product) return;
    
    let customizedImage = product.images?.[0];
    if (canvas) {
      customizedImage = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // High res
      });
    }

    const customizedProduct = {
      ...product,
      customizedImage,
      isCustomized: true,
      selectedSize: 'M', // Defaulting for now
      selectedColor: 'White', // Defaulting for now
    };

    addToCart(customizedProduct, 1);
    // Note: react-toastify or react-hot-toast should be used here, let's assume it's handled by addToCart or we can navigate to cart
    navigate('/cart');
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-full transition"
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-sm font-semibold tracking-wide">
            Product Customizer <span className="text-gray-500 font-normal">| {productId}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium mr-4">Total: ₹{product.salePrice || product.price || 0}</span>
          <button className="px-4 py-1.5 text-sm font-medium border border-gray-700 hover:bg-gray-800 rounded transition flex items-center gap-2">
            <IoDownloadOutline size={16} /> Preview
          </button>
          <button onClick={handleAddToCart} className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition flex items-center gap-2 cursor-pointer">
            <IoCartOutline size={16} /> Add to Cart
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Tools */}
        <SidebarTools activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Expanded Tool Panel */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto z-10 flex flex-col shadow-2xl relative">
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
        <div className="flex-1 bg-gray-900 relative flex items-center justify-center overflow-auto p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTIwIDBoLTIwdjIwaDIweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xOSAxOUgxVjFoMTh2MTh6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTIwIDBoLTF2MTloLTE5djFoMjB6IiBmaWxsPSIjMjIyMjIyIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]">
          <CanvasWorkspace 
            product={product} 
            imageSrc={product.images?.[currentViewIndex] || product.images?.[0]} 
            onCanvasReady={(c) => setCanvas(c)} 
          />
          
          {/* Bottom Zoom/View Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full px-4 py-2 flex items-center gap-4 shadow-lg">
             <button className="text-gray-300 hover:text-white">-</button>
             <span className="text-sm font-medium w-12 text-center">100%</span>
             <button className="text-gray-300 hover:text-white">+</button>
             <div className="w-px h-4 bg-gray-700"></div>
             {views.map((viewName, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentViewIndex(idx)}
                  className={`text-sm ${currentViewIndex === idx ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}
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
