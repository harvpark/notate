"use client";

import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { useParams } from "next/navigation";

export default function EditorPage() {
  // If you want the "sessionId" param, you can grab it like this:
  const { sessionId } = useParams();
  
  // The user’s chosen URL
  const [url, setUrl] = useState<string>("https://example.com");
  
  // Whether the canvas is currently catching mouse events to draw
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  
  // Internal state for drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Whenever the window resizes, we’ll re-size the canvas so it always matches
  // the displayed size of the container.
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Called on mousedown in the canvas
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setLastPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };
  
  // Called on mousemove in the canvas
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const newX = e.nativeEvent.offsetX;
    const newY = e.nativeEvent.offsetY;
    
    // Draw a line from the last position to the current position
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(newX, newY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    
    setLastPos({ x: newX, y: newY });
  };
  
  // Stop drawing on mouse up/out
  const handleMouseUp = () => setIsDrawing(false);
  const handleMouseOut = () => setIsDrawing(false);
  
  // Toggle whether pointer events on the canvas are active
  const toggleDrawing = () => {
    setDrawingEnabled(!drawingEnabled);
  };
  
  // Clear canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-xl font-bold mb-2">
        Session: {sessionId} – Notate an Embedded Page
      </h1>
      
      {/* Input box & Buttons */}
      <div className="mb-4 flex gap-2">
        <input
          className="border px-2 py-1"
          placeholder="Enter a website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "300px" }}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded"
          onClick={toggleDrawing}
        >
          {drawingEnabled ? "Stop Drawing" : "Start Drawing"}
        </button>
        <button
          className="bg-red-600 text-white px-4 py-1 rounded"
          onClick={clearCanvas}
        >
          Clear
        </button>
      </div>
      
      {/* Container with position: relative so we can overlay the canvas */}
      <div
        className="relative border"
        style={{ width: "80vw", height: "80vh" }}
      >
        {/* The embedded site */}
        <iframe
          src={url}
          className="absolute top-0 left-0 w-full h-full"
          style={{ border: "none" }}
        />
        
        {/* The drawing canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          // Use pointerEvents to toggle user’s ability to draw vs. click the iframe
          style={{
            pointerEvents: drawingEnabled ? "auto" : "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseOut}
        />
      </div>
    </div>
  );
}
