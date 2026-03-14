import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const encodePath = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

async function uploadViaXHR(params: {
  bucket: string;
  path: string;
  file: File;
  token: string;
  upsert: boolean;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { bucket, path, file, token, upsert, onProgress, signal } = params;
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const abort = () => {
      try { xhr.abort(); } catch { /* ignore */ }
    };

    if (signal) {
      if (signal.aborted) { abort(); reject(new DOMException("Aborted", "AbortError")); return; }
      signal.addEventListener("abort", abort, { once: true });
    }

    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`);
    xhr.responseType = "json";
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("x-upsert", upsert ? "true" : "false");

    const formData = new FormData();
    formData.append("", file, file.name);

    xhr.upload.onprogress = (evt) => {
      if (!onProgress) return;
      if (!evt.lengthComputable) { onProgress(0); return; }
      onProgress(Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100))));
    };

    xhr.onerror = () => {
      if (signal) signal.removeEventListener("abort", abort);
      reject(new Error("Network error while uploading. Please check your connection."));
    };

    xhr.onabort = () => {
      if (signal) signal.removeEventListener("abort", abort);
      reject(new DOMException("Upload cancelled", "AbortError"));
    };

    xhr.onload = () => {
      if (signal) signal.removeEventListener("abort", abort);
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      const msg =
        (xhr.response && (xhr.response.message || xhr.response.error)) ||
        (typeof xhr.responseText === "string" ? xhr.responseText : "Upload failed");
      reject(Object.assign(new Error(String(msg)), { status: xhr.status }));
    };

    xhr.send(formData);
  });
}

async function uploadViaSdk(params: {
  bucket: string;
  path: string;
  file: File;
  upsert: boolean;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const { bucket, path, file, upsert, onProgress } = params;

  onProgress?.(10);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert,
      contentType: file.type || "application/octet-stream",
    });

  if (error) throw error;
  onProgress?.(100);
}

export async function uploadObjectWithProgress(params: {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (percent: number) => void;
  upsert?: boolean;
  signal?: AbortSignal;
}): Promise<void> {
  const { bucket, path, file, onProgress, upsert = false, signal } = params;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload documents.");

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    // Fallback: use Supabase SDK without progress tracking
    await uploadViaSdk({ bucket, path, file, upsert, onProgress });
    return;
  }

  // Try XHR first for progress reporting; fall back to SDK on failure
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const abort = () => {
        try { xhr.abort(); } catch { /* ignore */ }
      };

      if (signal) {
        if (signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        signal.addEventListener("abort", abort, { once: true });
      }

      xhr.open("PUT", url);
      xhr.responseType = "json";
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", upsert ? "true" : "false");

      xhr.upload.onprogress = (evt) => {
        if (!onProgress) return;
        if (!evt.lengthComputable) { onProgress(0); return; }
        onProgress(Math.max(0, Math.min(95, Math.round((evt.loaded / evt.total) * 100))));
      };

      xhr.onerror = () => {
        if (signal) signal.removeEventListener("abort", abort);
        reject(new Error("Network error while uploading."));
      };

      xhr.onabort = () => {
        if (signal) signal.removeEventListener("abort", abort);
        reject(new DOMException("Upload cancelled", "AbortError"));
      };

      xhr.onload = () => {
        if (signal) signal.removeEventListener("abort", abort);
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
          return;
        }
        const msg =
          (xhr.response && (xhr.response.message || xhr.response.error)) ||
          (typeof xhr.responseText === "string" ? xhr.responseText : "Upload failed");
        reject(Object.assign(new Error(String(msg)), { status: xhr.status }));
      };

      xhr.send(file);
    });
  } catch (err: unknown) {
    const isAbort =
      err instanceof DOMException && err.name === "AbortError";
    if (isAbort) throw err;

    // Fallback to SDK upload (no per-byte progress)
    console.warn("XHR upload failed, falling back to SDK:", err);
    await uploadViaSdk({ bucket, path, file, upsert, onProgress });
  }
}
