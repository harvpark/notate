'use client';

import React, { useState } from 'react';

// Define tool types
export type AnnotationTool = 'select' | 'draw' | 'note' | 'image' | 'highlight';
export const ALL_TOOLS: AnnotationTool[] = ['select', 'draw', 'note', 'image', 'highlight'];

// Define tool options
interface ToolOptions {
  drawColor: string;
  highlightColor: string;
}

interface AnnotationToolbarProps {
  captureId: string;
  activeTool: AnnotationTool;
  onToolSelect: (tool: AnnotationTool) => void;
  toolOptions: ToolOptions;
  onToolOptionsChange: (options: Partial<ToolOptions>) => void; 
}

// Simple SVG Icons (can be replaced with an icon library)
const Icons = {
  select: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>,
  draw: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>,
  note: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  image: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  highlight: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M12.75 6.364l-4.122 4.122" /></svg>,
  share: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.186 2.25 2.25 0 00-3.933 2.186z" /></svg>,
  expand: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>,
  collapse: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
};

const DRAW_COLORS = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#000000'];
const HIGHLIGHT_COLORS = ['#FFFF00A0', '#00FFFFB0', '#FF00FFA0', '#00FF00A0'];

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({ 
  captureId,
  activeTool,
  onToolSelect,
  toolOptions,
  onToolOptionsChange
 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToolClick = (tool: AnnotationTool) => {
    onToolSelect(tool);
  };

  const handleDrawColorChange = (color: string) => {
    onToolOptionsChange({ drawColor: color });
  };

  const handleHighlightColorChange = (color: string) => {
    onToolOptionsChange({ highlightColor: color });
  };

  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-4xl bg-gray-900/90 backdrop-blur-md text-white rounded-lg shadow-xl transition-all duration-300 ease-in-out z-50 flex flex-col`}
    >
      {/* Main Toolbar Row */}
      <div className="flex items-center justify-between p-2 h-14">
        {/* Left side: Tools */} 
        <div className="flex items-center gap-1 sm:gap-2">
          {(ALL_TOOLS).map(tool => (
            <button 
              key={tool}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)} 
              onClick={() => handleToolClick(tool)}
              className={`p-2 rounded ${activeTool === tool ? 'bg-blue-600' : 'hover:bg-gray-700'} transition-colors`}
            >
              {Icons[tool]}
            </button>
          ))}
        </div>

        {/* Center: Capture ID (optional) - hidden on small screens */}
        <div className="hidden sm:block text-xs text-gray-400">Capture: {captureId}</div>

        {/* Right side: Share, Collapse/Expand */} 
        <div className="flex items-center gap-1 sm:gap-2">
          <button title="Share" className="p-2 rounded hover:bg-gray-700 transition-colors">
            {Icons.share}
          </button>
          <button 
            title={isCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'} 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? Icons.expand : Icons.collapse}
          </button>
        </div>
      </div>

      {/* Conditional Options Rows */}
      {!isCollapsed && (
        <div className="flex items-center justify-center gap-2 p-2 border-t border-gray-700 min-h-[40px]">
          {/* Draw Options */}
          {activeTool === 'draw' && (
            <>
              <span className="text-xs mr-2">Color:</span>
              {DRAW_COLORS.map(color => (
                <button 
                  key={color}
                  onClick={() => handleDrawColorChange(color)}
                  className={`w-6 h-6 rounded-full border-2 ${toolOptions.drawColor === color ? 'border-white' : 'border-transparent'} transition-all`}
                  style={{ backgroundColor: color }}
                  title={`Draw color: ${color}`}
                />
              ))}
            </>
          )}

          {/* Highlight Options */}
          {activeTool === 'highlight' && (
            <>
              <span className="text-xs mr-2">Highlight:</span>
              {HIGHLIGHT_COLORS.map(color => (
                <button 
                  key={color}
                  onClick={() => handleHighlightColorChange(color)}
                  className={`w-6 h-6 rounded border-2 ${toolOptions.highlightColor === color ? 'border-white' : 'border-gray-500'} transition-all`}
                  style={{ backgroundColor: color }}
                  title={`Highlight color: ${color}`}
                />
              ))}
            </>
          )}

          {/* Add other tool options here */}
          {/* Placeholder if no options for selected tool */}
          {activeTool !== 'draw' && activeTool !== 'highlight' && (
              <span className="text-xs text-gray-500">Select a tool</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar; 