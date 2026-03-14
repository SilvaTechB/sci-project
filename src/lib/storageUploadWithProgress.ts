import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

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
    throw new Error("Missing backend configuration for uploads.");
  }

  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const abort = () => {
      try {
        xhr.abort();
      } catch {
        // ignore
      }
    };

    if (signal) {
      if (signal.aborted) abort();
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
      if (!evt.lengthComputable) {
        onProgress(0);
        return;
      }
      const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
      onProgress(pct);
    };

    xhr.onerror = () => {
      if (signal) signal.removeEventListener("abort", abort);
      reject(new Error("Network error while uploading."));
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
}
