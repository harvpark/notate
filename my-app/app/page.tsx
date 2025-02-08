"use client";
import { useState } from "react";
import { Pencil, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation";


//this is the home page where you enter a URL

export default function WebAnnotator() {
  const router = useRouter();
  const [url, setUrl] = useState<string>("");

  const handleSubmit = () => {
    if (url) {
      // Create a session ID (you might want to generate this properly)
      const sessionId = encodeURIComponent(url);
      router.push(`/editor/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl md:text-5xl lg:text-6xl text-center mb-16 font-serif">annotate anything on the web</h1>

      <div className="w-full max-w-2xl">
        {/* Decorative elements */}
        <div className="relative h-20 mb-6">
          {/* Pencil icon */}
          <div className="absolute left-[20%] top-1/2 transform -translate-y-1/2">
            <Pencil className="w-8 h-8 text-gray-800" />
          </div>

          {/* Green note */}
          <div className="absolute left-[45%] top-1/2 transform -translate-y-1/2">
            <div className="w-16 h-16 bg-green-100 rounded-sm transform rotate-3 shadow-sm">
              <div className="absolute -right-1 -top-1 w-4 h-4 bg-green-100 transform rotate-45" />
            </div>
          </div>

          {/* Chat bubbles */}
          <div className="absolute right-[20%] top-1/2 transform -translate-y-1/2">
            <div className="relative">
              <MessageSquare className="w-12 h-12 absolute -top-2 -right-2 text-yellow-200 fill-yellow-200" />
              <MessageSquare className="w-12 h-12 text-purple-200 fill-purple-200" />
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Input
            type="url"
            placeholder="enter a link to annotate!"
            className="w-full h-12 px-4 text-lg bg-gray-100/80 border-none rounded-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
            aria-label="Submit"
          >
            <span className="rotate-90">↵</span>
          </button>
        </div>
      </div>
    </div>
  )
}
