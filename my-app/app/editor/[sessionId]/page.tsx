"use client";

import { useParams } from "next/navigation";
import React, { useState } from "react";

export default function EditorPage() {
  const params = useParams();
  const rawUrl = decodeURIComponent(params.sessionId as string);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ensure URL has protocol and use proxy
  const getProxiedUrl = (url: string) => {
    try {
      // Ensure URL has protocol
      let validUrl = url;
      if (!url.startsWith('http')) {
        validUrl = `https://${url}`;
      }
      
      // Using allorigins.win proxy service
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(validUrl)}`;
    } catch (e) {
      console.error('URL processing error:', e);
      setError('Invalid URL format');
      return url;
    }
  };

  const proxiedUrl = getProxiedUrl(rawUrl);
  console.log('Attempting to load:', proxiedUrl); // Debug log

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b px-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">Web Annotator</h1>
          <span className="text-sm text-gray-500 truncate max-w-md">{rawUrl}</span>
        </div>
      </header>

      <div className="flex-1 relative">
        <iframe
          src={proxiedUrl}
          className="w-full h-full"
          style={{ border: "none" }}
          title="Web Content"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={(e) => {
            console.log('iframe loaded');
            setIsLoading(false);
          }}
          onError={(e) => {
            console.error('iframe error:', e);
            setError('Failed to load content. The website might block embedding.');
            setIsLoading(false);
          }}
        />
        
        {/* Loading and error states */}
        {isLoading && (
          <div className="absolute top-4 left-4 bg-blue-100 p-4 rounded-md">
            Loading {rawUrl}...
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-4 bg-red-100 p-4 rounded-md text-red-700">
            {error}
            <br />
            URL: {proxiedUrl}
          </div>
        )}
      </div>
    </div>
  );
}
