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
      <h1 className="text-4xl md:text-5xl lg:text-7xl text-center mb-16">Annotate anything on the web:</h1>

      <div className="w-full max-w-2xl">

        {/* Search input */}
        <div className="relative">
          <Input
            type="url"
            placeholder="enter a link to annotate!"
            className="w-full h-12 px-4 text-lg bg-[#F3F3F3] border-[#CACACA] rounded-xl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-400 transition-colors"
            aria-label="Submit"
          >
            <span className="rotate-90">↵</span>
          </button>
        </div>
      </div>
    </div>
  )
}
