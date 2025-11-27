import React from 'react';
import { Pencil, Eraser, Trash2, Download, MousePointer2 } from 'lucide-react';

interface ToolbarProps {
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  tool: 'pen' | 'eraser';
  setTool: (t: 'pen' | 'eraser') => void;
  onClear: () => void;
  onDownload: () => void;
}

const COLORS = [
  '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'
];

export const Toolbar: React.FC<ToolbarProps> = ({
  color,
  setColor,
  width,
  setWidth,
  tool,
  setTool,
  onClear,
  onDownload,
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-3 flex items-center gap-4 border border-slate-200 z-50 transition-all">
      {/* Tools */}
      <div className="flex gap-2 border-r border-slate-200 pr-4">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Pen"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-4 border-r border-slate-200 pr-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Size</label>
          <input
            type="range"
            min="1"
            max="40"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        <div className="grid grid-cols-5 gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool('pen');
              }}
              className={`w-5 h-5 rounded-full border border-slate-200 transition-transform hover:scale-110 ${
                color === c && tool === 'pen' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear Board"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={onDownload}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Save Image"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
};
