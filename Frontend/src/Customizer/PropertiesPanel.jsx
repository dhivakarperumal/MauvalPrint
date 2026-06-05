import React, { useState, useEffect } from 'react';
import { IoDuplicateOutline, IoLayersOutline } from 'react-icons/io5';

const PropertiesPanel = ({ activeObject, canvas, setActiveObject }) => {
  const [tick, setTick] = useState(0);

  // Force re-render when activeObject changes externally
  useEffect(() => {
    setTick(t => t + 1);
  }, [activeObject]);

  if (!activeObject || !canvas) return null;

  const isText = activeObject.type === 'i-text';
  const isImage = activeObject.type === 'image';
  const isShape = activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle';

  const handlePropertyChange = (property, value) => {
    activeObject.set(property, value);
    canvas.requestRenderAll();
    setTick(t => t + 1); // Force re-render of this panel
  };

  const handleDuplicate = () => {
    activeObject.clone().then((cloned) => {
      cloned.set({
        left: activeObject.left + 20,
        top: activeObject.top + 20,
        evented: true,
      });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas;
        cloned.forEachObject((obj) => canvas.add(obj));
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const handleImageScaleChange = (value) => {
    if (!activeObject || !isImage) return;
    activeObject.set({ scaleX: value, scaleY: value });
    canvas.requestRenderAll();
    setTick(t => t + 1);
  };

  const handleImagePositionChange = (property, value) => {
    if (!activeObject || !isImage) return;
    activeObject.set(property, value);
    canvas.requestRenderAll();
    setTick(t => t + 1);
  };

  const handleBringForward = () => {
    canvas.bringObjectForward(activeObject);
    canvas.requestRenderAll();
  };

  const handleSendBackward = () => {
    canvas.sendObjectBackwards(activeObject);
    canvas.requestRenderAll();
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Properties</h3>

      {/* Common Controls: Layers & Duplicate */}
      <div className="flex gap-2 mb-2">
        <button onClick={handleDuplicate} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center gap-2 text-xs">
          <IoDuplicateOutline /> Duplicate
        </button>
        <button onClick={handleBringForward} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center gap-1 text-xs">
          Up
        </button>
        <button onClick={handleSendBackward} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center gap-1 text-xs">
          Down
        </button>
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-300">Opacity: {Math.round((activeObject.opacity || 1) * 100)}%</span>
        <input 
          type="range" 
          min="0.1" max="1" step="0.1" 
          value={activeObject.opacity || 1} 
          onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Color Picker (Text & Shapes) */}
      {(isText || isShape) && (
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700">
          <span className="text-xs font-medium">Color</span>
          <input 
            type="color" 
            value={activeObject.fill || '#000000'} 
            onChange={(e) => handlePropertyChange('fill', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
          />
        </div>
      )}

      {/* Text Specific Controls */}
      {isText && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-300">Font Family</span>
            <select 
              value={activeObject.fontFamily} 
              onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handlePropertyChange('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')}
              className={`flex-1 py-1 rounded text-xs font-bold ${activeObject.fontWeight === 'bold' ? 'bg-indigo-600 text-white' : 'bg-gray-800'}`}
            >B</button>
            <button 
              onClick={() => handlePropertyChange('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')}
              className={`flex-1 py-1 rounded text-xs italic ${activeObject.fontStyle === 'italic' ? 'bg-indigo-600 text-white' : 'bg-gray-800'}`}
            >I</button>
            <button 
              onClick={() => handlePropertyChange('underline', !activeObject.underline)}
              className={`flex-1 py-1 rounded text-xs underline ${activeObject.underline ? 'bg-indigo-600 text-white' : 'bg-gray-800'}`}
            >U</button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-300">Letter Spacing</span>
            <input type="range" min="-50" max="500" value={activeObject.charSpacing || 0} onChange={(e) => handlePropertyChange('charSpacing', parseInt(e.target.value))} className="w-full accent-indigo-500" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-300">Line Height</span>
            <input type="range" min="0.5" max="3" step="0.1" value={activeObject.lineHeight || 1.16} onChange={(e) => handlePropertyChange('lineHeight', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
          </div>
      
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">Font Size</span>
              <span className="text-xs text-gray-400">{Math.round(activeObject.fontSize || 24)} px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="8"
                max="200"
                step="1"
                value={activeObject.fontSize || 24}
                onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value, 10))}
                className="flex-1 accent-indigo-500"
              />
              <input
                type="number"
                min="8"
                max="200"
                value={activeObject.fontSize || 24}
                onChange={(e) => {
                  const v = parseInt(e.target.value || '24', 10);
                  if (!isNaN(v)) handlePropertyChange('fontSize', v);
                }}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              />
            </div>
          </div>
        </>
      )}

      {/* Image Filters (Mock for now) */}
      {isImage && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-300">Image Position</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col text-xs text-gray-300">
                X
                <input
                  type="range"
                  min="-250"
                  max="250"
                  step="1"
                  value={activeObject.left || 0}
                  onChange={(e) => handleImagePositionChange('left', parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </label>
              <label className="flex flex-col text-xs text-gray-300">
                Y
                <input
                  type="range"
                  min="-250"
                  max="250"
                  step="1"
                  value={activeObject.top || 0}
                  onChange={(e) => handleImagePositionChange('top', parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-300">Image Scale</span>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.05"
              value={activeObject.scaleX || 1}
              onChange={(e) => handleImageScaleChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{Math.round((activeObject.scaleX || 1) * 100)}%</span>
              <button
                onClick={() => {
                  if (!activeObject) return;
                  activeObject.set({ left: 0, top: 0, scaleX: 1, scaleY: 1 });
                  canvas.requestRenderAll();
                  setTick(t => t + 1);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-200"
              >Reset</button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-300">Image Filters</span>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs">Grayscale</button>
              <button className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs">Vintage</button>
              <button className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs">Remove BG ✨</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;
