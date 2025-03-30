'use client';

import React, { useState } from 'react';

export interface Note {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string; // Optional: Add color later
}

interface StickyNoteProps {
  note: Note;
  onChange: (id: string, text: string) => void;
  // TODO: Add props for dragging (onDragStart, onDragEnd) and deleting
}

const StickyNote: React.FC<StickyNoteProps> = ({ note, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(note.text);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(note.id, currentText);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click from propagating to the overlay underneath if editing
    if (isEditing) {
        e.stopPropagation();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent adding another note
      setIsEditing(true);
  };

  return (
    <div
      className="absolute p-2 w-40 h-40 bg-yellow-200 shadow-md cursor-grab flex flex-col overflow-hidden text-sm text-black" // Added text-black
      style={{ left: `${note.x}px`, top: `${note.y}px` }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent overlay drawing when interacting with note
      onMouseUp={(e) => e.stopPropagation()}
      onClick={handleClick} 
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {isEditing ? (
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full resize-none bg-transparent focus:outline-none p-1 text-black"
          autoFocus
        />
      ) : (
        <div className="w-full h-full p-1 whitespace-pre-wrap break-words">
          {currentText || "Click to edit..."}
        </div>
      )}
    </div>
  );
};

export default StickyNote; 