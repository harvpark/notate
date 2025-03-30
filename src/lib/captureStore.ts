// NOTE: This is a TEMPORARY in-memory store for demonstration purposes only.
// In a real application, this data should be persisted in a database and/or blob storage.
const captureCache = new Map<string, string>();

export function storeCapture(id: string, html: string) {
  console.log(`[CaptureStore] Storing capture for ID: ${id} (Size: ${Math.round(html.length / 1024)} KB)`);
  captureCache.set(id, html);
  // Optional: Add logic to limit cache size or TTL if needed for memory management
}

export function getCapture(id: string): string | undefined {
  console.log(`[CaptureStore] Retrieving capture for ID: ${id}`);
  return captureCache.get(id);
}

export function deleteCapture(id: string): boolean {
  console.log(`[CaptureStore] Deleting capture for ID: ${id}`);
  return captureCache.delete(id);
} 