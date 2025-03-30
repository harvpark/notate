'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!url) {
      setError('Please enter a URL.');
      setIsLoading(false);
      return;
    }

    try {
      // Basic URL validation (can be improved)
      new URL(url);
    } catch (_) {
      setError('Please enter a valid URL.');
      setIsLoading(false);
      return;
    }

    try {
      // Call the backend API to capture the URL
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = 'Failed to capture the URL.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Ignore if response body is not JSON
          console.error('Error parsing error response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const captureId = data.captureId;

      if (!captureId) {
        throw new Error('No capture ID received from server.');
      }

      // Redirect to the annotation page
      router.push(`/view/${captureId}`);

    } catch (err) {
      console.error('Error capturing URL:', err);
      // Display the specific error message from the API or a generic one
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 w-full max-w-2xl items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">Notate</h1>
        <p className="text-lg text-center text-gray-600">
          Capture, annotate, and share web pages easily.
        </p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL to annotate (e.g., https://example.com)"
            className="flex-grow px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-6 py-3 ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out whitespace-nowrap`}
            disabled={isLoading}
          >
            {isLoading ? 'Capturing...' : 'Capture & Annotate'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {isLoading && (
          <div className="mt-4 flex items-center justify-center text-gray-600">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing your request... this might take a few seconds.
          </div>
        )}
      </div>
    </main>
  );
}
