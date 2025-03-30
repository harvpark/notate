'use client';

import { useParams } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added hooks
import AnnotationToolbar, { AnnotationTool } from '@/components/AnnotationToolbar'; // Import type
import StickyNote, { Note } from '@/components/StickyNote'; // Import Note component and type

// Types
interface ToolOptions {
  drawColor: string;
  highlightColor: string;
}

interface HighlightRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface ImageAnnotation {
  id: string;
  x: number;
  y: number;
  src: string; // Data URL for preview, later maybe permanent URL
  width: number; // Store original/display width/height?
  height: number;
}

// TODO: Implement Annotation Toolbar component
// function AnnotationToolbar() {
//   return (
//     <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 text-white flex items-center justify-center z-50">
//       Annotation Toolbar Placeholder
//     </div>
//   );
// }

export default function ViewCapturePage() {
  const params = useParams();
  const captureId = params.captureId as string;

  // State for annotation tools
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [toolOptions, setToolOptions] = useState<ToolOptions>({ 
      drawColor: '#FF0000', 
      highlightColor: '#FFFF00A0' // Default yellow highlight
  }); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);

  // State for annotations
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<HighlightRect | null>(null);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([]); // State for images
  const [pendingImageCoords, setPendingImageCoords] = useState<{ x: number; y: number } | null>(null); // Coords for next image

  // Refs for canvas drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null); // Ref for the overlay div
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

  const capturedContentUrl = `/api/content/${captureId}`;

  // Toolbar handlers
  const handleToolSelect = useCallback((tool: AnnotationTool) => {
    setActiveTool(tool);
    console.log("Selected tool:", tool);
  }, []);

  const handleToolOptionsChange = useCallback((options: Partial<ToolOptions>) => {
    setToolOptions(prevOptions => ({ ...prevOptions, ...options }));
  }, []);

  // Canvas setup effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const resizeCanvas = () => {
        canvas.width = overlay.offsetWidth;
        canvas.height = overlay.offsetHeight;
        // Re-initialize context properties after resize
        const context = canvas.getContext('2d');
        if (context) {
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.lineWidth = 3; // Example line width
          contextRef.current = context;
          console.log('Canvas resized and context initialized');
          // After resizing, redraw persistent annotations
          redrawAnnotations();
        } else {
          console.error('Failed to get 2D context');
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);

  }, []); // Re-run if needed, though annotations redraw separately

  // Effect to redraw canvas when annotations change
  useEffect(() => {
    redrawAnnotations();
  }, [highlights]); // Redraw when highlights change

  // --- Drawing & Annotation Logic ---
  const redrawAnnotations = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw highlights
    highlights.forEach(rect => {
        context.fillStyle = rect.color;
        context.fillRect(rect.x, rect.y, rect.width, rect.height);
    });

    // Redraw current highlight preview if any
    if (currentHighlight) {
      context.fillStyle = currentHighlight.color;
      context.fillRect(currentHighlight.x, currentHighlight.y, currentHighlight.width, currentHighlight.height);
    }

    // TODO: Redraw freehand drawings (will require storing drawing paths)
  };

  // --- Drawing Handlers ---
  const getCoords = (event: React.MouseEvent<HTMLDivElement>): { x: number; y: number } | null => {
    const overlay = overlayRef.current;
    if (!overlay) return null;
    const rect = overlay.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  // Mouse Down Handler
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== overlayRef.current) return;
    const coords = getCoords(event);
    if (!coords) return;

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true);
      setStartCoords(coords);
      if (activeTool === 'draw' && contextRef.current) {
        contextRef.current.strokeStyle = toolOptions.drawColor;
        contextRef.current.beginPath();
        contextRef.current.moveTo(coords.x, coords.y);
      } else if (activeTool === 'highlight') {
         // Start drawing temporary highlight rectangle
         setCurrentHighlight({
             id: 'temp', x: coords.x, y: coords.y, width: 0, height: 0, color: toolOptions.highlightColor
         });
      }
    } else if (activeTool === 'note') {
      // Create a new note
      const newNote: Note = {
        id: `note_${Date.now()}`,
        x: coords.x - 70, // Offset slightly so click is near corner, adjust as needed
        y: coords.y - 10,
        text: '', // Start with empty text
        color: 'yellow' // Default color for now
      };
      setNotes(prevNotes => [...prevNotes, newNote]);
      console.log("Added note:", newNote);
      // TODO: Persist new note to backend

      // Optional: Switch back to select tool after adding a note
      // handleToolSelect('select'); 
    } else if (activeTool === 'image') {
        // Store coords and trigger file input
        setPendingImageCoords(coords);
        fileInputRef.current?.click();
        // Prevent default drag behavior if any
        event.preventDefault(); 
    }
  }, [activeTool, toolOptions, getCoords]);

  // Mouse Move Handler
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startCoords) return;
    const coords = getCoords(event);
    if (!coords) return;

    if (activeTool === 'draw' && contextRef.current) {
        contextRef.current.lineTo(coords.x, coords.y);
        contextRef.current.stroke();
        // PROBLEM: This draws permanently. Needs path storing/redrawing logic
        // For now, freehand drawing is broken by highlight redraw logic.
    } else if (activeTool === 'highlight' && currentHighlight) {
        const width = coords.x - startCoords.x;
        const height = coords.y - startCoords.y;
        setCurrentHighlight({
            ...currentHighlight,
            x: width < 0 ? coords.x : startCoords.x,
            y: height < 0 ? coords.y : startCoords.y,
            width: Math.abs(width),
            height: Math.abs(height)
        });
        // Redraw canvas to show preview
        redrawAnnotations();
    }
  }, [isDrawing, activeTool, startCoords, currentHighlight, redrawAnnotations]); // Added dependencies

  // Mouse Up Handler
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStartCoords(null);

    if (activeTool === 'draw' && contextRef.current) {
        contextRef.current.closePath();
        // TODO: Store the completed path
    } else if (activeTool === 'highlight' && currentHighlight) {
        // Add the completed highlight to the state
        if (currentHighlight.width > 0 && currentHighlight.height > 0) { // Avoid adding zero-size rects
          setHighlights(prev => [...prev, { ...currentHighlight, id: `hl_${Date.now()}` }]);
          console.log("Added highlight", currentHighlight);
          // TODO: Persist highlight
        }
        setCurrentHighlight(null); // Clear the temporary highlight
        redrawAnnotations(); // Final redraw without temp rect
    }

  }, [isDrawing, activeTool, currentHighlight, redrawAnnotations]); // Added dependencies

  // Mouse Leave Handler
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
       // Treat like mouse up if drawing leaves the area
       handleMouseUp();
    }
  }, [isDrawing, handleMouseUp]);

  // --- Annotation Handlers ---
  const handleNoteChange = useCallback((id: string, text: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => (note.id === id ? { ...note, text } : note))
    );
    // TODO: Persist note changes to backend
    console.log(`Note ${id} updated: ${text}`);
  }, []);

  // Image File Input Handler
  const handleImageFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset input value so the same file can be selected again
    event.target.value = ''; 

    if (!file || !pendingImageCoords) {
      setPendingImageCoords(null); // Clear pending coords if no file
      return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        setPendingImageCoords(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl && pendingImageCoords) {
          // Create temporary image object to get dimensions (optional, but good)
          const img = new Image();
          img.onload = () => {
              // Scale down large images for preview if needed
              const MAX_WIDTH = 200;
              const scale = Math.min(1, MAX_WIDTH / img.width); 
              const displayWidth = img.width * scale;
              const displayHeight = img.height * scale;

              const newImageAnnotation: ImageAnnotation = {
                  id: `img_${Date.now()}`,
                  x: pendingImageCoords.x - displayWidth / 2, // Center image on click point
                  y: pendingImageCoords.y - displayHeight / 2,
                  src: dataUrl,
                  width: displayWidth,
                  height: displayHeight,
              };
              setImageAnnotations(prev => [...prev, newImageAnnotation]);
              console.log("Added image annotation:", newImageAnnotation);
              // TODO: Upload actual file to backend and update src later
              setPendingImageCoords(null); // Clear pending coords
          }
          img.onerror = () => {
              console.error("Failed to load image for dimension check");
              alert('Failed to process image file.');
              setPendingImageCoords(null);
          }
          img.src = dataUrl; // Load data URL into image object
      }
    };
    reader.onerror = () => {
        console.error("FileReader error");
        alert('Failed to read image file.');
        setPendingImageCoords(null);
    };
    reader.readAsDataURL(file); // Read the file as Data URL

    // Optional: Switch back to select tool after initiating upload
    // handleToolSelect('select');
  };

  // --- Component Render ---
  if (!captureId) {
    return <div>Loading capture...</div>; // Or handle error
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-200"> {/* Added bg for visibility */}
      {/* Iframe for captured content - pointer events disabled when annotating */}
      <iframe
        src={capturedContentUrl}
        title={`Captured Content - ${captureId}`}
        className="w-full h-full border-none bg-white" // Added bg-white
        style={{ pointerEvents: activeTool !== 'select' ? 'none' : 'auto' }} // Allow interaction only when select tool is active
      />

      {/* Annotation Overlay - positioned above the iframe */}
      <div 
        ref={overlayRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair" // Default cursor
        style={{
          pointerEvents: activeTool === 'select' ? 'none' : 'auto',
          cursor: activeTool === 'draw' ? 'crosshair' : 
                  activeTool === 'highlight' ? 'crosshair' : 
                  activeTool === 'note' ? 'text' : 
                  activeTool === 'image' ? 'copy' : // Use a different cursor for image add
                  'default' 
        }}
        onMouseDown={handleMouseDown} 
        onMouseUp={handleMouseUp}      // Use updated handler
        onMouseMove={handleMouseMove}  // Use updated handler
        onMouseLeave={handleMouseLeave} // Use updated handler
      >
          {/* Canvas for drawing annotations */}
          <canvas 
             ref={canvasRef}
             className="absolute top-0 left-0 w-full h-full" 
             // Style canvas to be transparent, events handled by parent div
             style={{ pointerEvents: 'none' }} 
          />

          {/* Render Sticky Notes */}
          {notes.map(note => (
            <StickyNote 
              key={note.id}
              note={note}
              onChange={handleNoteChange}
              // Pass other handlers later (drag, delete)
            />
          ))}
          
          {/* Render Image Annotations */}
          {imageAnnotations.map(imgAnn => (
            <img 
              key={imgAnn.id}
              src={imgAnn.src}
              alt="User uploaded annotation" 
              className="absolute shadow-md bg-white p-1 border border-gray-300" // Basic styling
              style={{ 
                left: `${imgAnn.x}px`, 
                top: `${imgAnn.y}px`,
                width: `${imgAnn.width}px`,
                height: `${imgAnn.height}px`,
                cursor: 'grab', // Add cursor for potential dragging later
                pointerEvents: activeTool === 'select' ? 'auto' : 'none' // Allow interaction only in select mode
              }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent overlay actions when clicking image
              onMouseUp={(e) => e.stopPropagation()}
            />
          ))}
      </div>

      {/* Hidden File Input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileSelected}
        accept="image/*" // Accept only image types
        style={{ display: 'none' }} 
      />

      {/* Annotation Toolbar */} 
      <AnnotationToolbar 
        captureId={captureId} 
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        toolOptions={toolOptions}
        onToolOptionsChange={handleToolOptionsChange}
      />
    </div>
  );
} 