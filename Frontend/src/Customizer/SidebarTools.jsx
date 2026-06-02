import React from 'react';
import { IoImageOutline, IoTextOutline, IoShapesOutline, IoColorWandOutline, IoLayersOutline, IoBrushOutline, IoGridOutline, IoOptionsOutline } from 'react-icons/io5';

const SidebarTools = ({ activeTab, setActiveTab }) => {
  const tools = [
    { id: 'templates', icon: <IoGridOutline size={24} />, label: 'Templates' },
    { id: 'uploads', icon: <IoImageOutline size={24} />, label: 'Uploads' },
    { id: 'text', icon: <IoTextOutline size={24} />, label: 'Text' },
    { id: 'elements', icon: <IoShapesOutline size={24} />, label: 'Elements' },
    { id: 'draw', icon: <IoBrushOutline size={24} />, label: 'Draw' },
    { id: 'ai', icon: <IoColorWandOutline size={24} />, label: 'AI Magic' },
    { id: 'layers', icon: <IoLayersOutline size={24} />, label: 'Layers' },
    { id: 'settings', icon: <IoOptionsOutline size={24} />, label: 'Settings' },
  ];

  return (
    <aside className="w-full md:w-24 bg-gray-950 border-t md:border-t-0 md:border-r border-gray-800 flex flex-row md:flex-col items-center py-2 md:py-6 px-4 md:px-0 gap-3 z-30 overflow-x-auto md:overflow-y-auto shrink-0 custom-scrollbar">
      {tools.map(tool => (
        <button 
          key={tool.id}
          onClick={() => setActiveTab(tool.id)}
          className={`shrink-0 flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl text-[10px] md:text-[11px] font-medium gap-1 md:gap-2 transition-all duration-300 ${
            activeTab === tool.id 
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-105'
          }`}
        >
          {tool.icon}
          <span>{tool.label}</span>
        </button>
      ))}
    </aside>
  );
};

export default SidebarTools;
