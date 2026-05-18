// Simple, lightweight, zero-dependency IndexedDB wrapper for Memories App
// Allows persistent storage of custom uploaded files (Images & Audio Blobs) to prevent localStorage Quota Overflow

const DB_NAME = 'MemoriesDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'custom_media';

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Saves a Blob (or File) in IndexedDB under a unique key
 */
export async function saveMediaBlob(key: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to save media in IndexedDB for key: ${key}`, error);
  }
}

/**
 * Retrieves a Blob from IndexedDB under a unique key
 */
export async function getMediaBlob(key: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to get media from IndexedDB for key: ${key}`, error);
    return null;
  }
}

/**
 * Deletes a Blob from IndexedDB under a unique key
 */
export async function deleteMediaBlob(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to delete media from IndexedDB for key: ${key}`, error);
  }
}

// In-memory cache for generated object URLs to prevent duplicate memory allocations and leaks
const urlCache = new Map<string, string>();

/**
 * Resolves a URL string. 
 * If it's a db:// reference, fetches the Blob from IndexedDB and returns a fresh, valid object URL.
 * Otherwise, returns the original URL.
 */
export async function resolveMediaUrl(urlOrRef: string): Promise<string> {
  if (!urlOrRef) return '';

  if (urlOrRef.startsWith('db://')) {
    const key = urlOrRef.substring(5); // Remove 'db://' prefix
    
    // Check if we already resolved and cached this URL in the current session
    if (urlCache.has(key)) {
      return urlCache.get(key) || '';
    }

    const blob = await getMediaBlob(key);
    if (blob) {
      const freshUrl = URL.createObjectURL(blob);
      urlCache.set(key, freshUrl);
      return freshUrl;
    } else {
      console.warn(`IndexedDB: Media not found for key "${key}". Falling back to default.`);
      return '';
    }
  }

  // Regular URL (HTTP/HTTPS) or already resolved blob: URL
  return urlOrRef;
}

/**
 * Helper to register a newly uploaded local File/Blob into IndexedDB and return its db:// representation
 */
export async function registerLocalFile(file: Blob, prefix: 'photo' | 'music' = 'photo'): Promise<string> {
  const uniqueId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await saveMediaBlob(uniqueId, file);
  return `db://${uniqueId}`;
}
