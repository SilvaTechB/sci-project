import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadObjectWithProgress } from "@/lib/storageUploadWithProgress";
import { validateFile } from "@/lib/fileValidation";
import { toast } from "sonner";

export type UploadStatus = "queued" | "uploading" | "success" | "failed" | "cancelled" | "validating";

export interface UploadItem {
  id: string;
  projectId: string;
  docType: string;
  fileName: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

interface ProfileLike {
  user_id: string;
  id?: string;
}

const BUCKET = "project-documents";

const safeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeDocType = (docType: string) => docType.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const buildFilePath = (userId: string, projectId: string, docType: string, fileName: string) => {
  const normalized = normalizeDocType(docType);
  return `${userId}/${projectId}/${normalized}-${Date.now()}-${fileName}`;
};

export function useUploadQueue(params: {
  profile: ProfileLike | null;
  onDocumentsChanged?: (projectId: string) => void;
}) {
  const { profile, onDocumentsChanged } = params;

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const abortersRef = useRef(new Map<string, AbortController>());

  const hasUploading = useMemo(() => uploads.some((u) => u.status === "uploading"), [uploads]);

  const queueUpload = (input: { projectId: string; docType: string; file: File }) => {
    if (!profile) throw new Error("You must be signed in to upload documents.");

    const id = safeId();
    setUploads((prev) => [
      ...prev,
      {
        id,
        projectId: input.projectId,
        docType: input.docType,
        fileName: input.file.name,
        file: input.file,
        status: "queued",
        progress: 0,
      },
    ]);

    return id;
  };

  const retryUpload = (id: string) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: "queued",
              progress: 0,
              error: undefined,
            }
          : u,
      ),
    );
  };

  const cancelUpload = (id: string) => {
    const aborter = abortersRef.current.get(id);
    aborter?.abort();
    abortersRef.current.delete(id);

    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "cancelled", error: "Cancelled by user." } : u)),
    );
  };

  const dismissUpload = (id: string) => {
    const aborter = abortersRef.current.get(id);
    aborter?.abort();
    abortersRef.current.delete(id);
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== "success"));
  };

  useEffect(() => {
    if (!profile) return;
    
    // Check for validating or uploading status
    const hasActive = uploads.some((u) => u.status === "uploading" || u.status === "validating");
    if (hasActive) return;

    const next = uploads.find((u) => u.status === "queued");
    if (!next) return;

    let cancelled = false;

    const run = async () => {
      const controller = new AbortController();
      abortersRef.current.set(next.id, controller);

      // Step 1: Validate the file first
      setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "validating", progress: 0 } : u)));

      const validationResult = await validateFile(next.file);
      if (!validationResult.valid) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === next.id
              ? { ...u, status: "failed", error: validationResult.error || "Validation failed" }
              : u,
          ),
        );
        toast.error(validationResult.error || "File validation failed");
        return;
      }

      const filePath = buildFilePath(profile.user_id, next.projectId, next.docType, next.fileName);

      setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "uploading", progress: 0 } : u)));

      try {
        await uploadObjectWithProgress({
          bucket: BUCKET,
          path: filePath,
          file: next.file,
          upsert: false,
          signal: controller.signal,
          onProgress: (pct) => {
            if (cancelled) return;
            setUploads((prev) =>
              prev.map((u) => (u.id === next.id ? { ...u, progress: pct, status: "uploading" } : u)),
            );
          },
        });

        // Step 2: Handle versioning - mark previous versions as non-current
        const { data: existingDocs } = await supabase
          .from("project_documents")
          .select("id, version")
          .eq("project_id", next.projectId)
          .eq("document_type", next.docType)
          .eq("is_current", true);

        let newVersion = 1;
        if (existingDocs && existingDocs.length > 0) {
          // Get max version
          const maxVersion = Math.max(...existingDocs.map((d) => d.version || 1));
          newVersion = maxVersion + 1;

          // Mark all existing as non-current
          await supabase
            .from("project_documents")
            .update({ is_current: false })
            .eq("project_id", next.projectId)
            .eq("document_type", next.docType);
        }

        // Step 3: Insert new document record
        const { error: dbError } = await supabase.from("project_documents").insert({
          project_id: next.projectId,
          document_type: next.docType,
          file_name: next.fileName,
          file_path: filePath,
          file_size: next.file.size,
          version: newVersion,
          is_current: true,
        });

        if (dbError) {
          // avoid orphaned uploads if DB insert fails
          await supabase.storage.from(BUCKET).remove([filePath]);
          throw dbError;
        }

        setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "success", progress: 100 } : u)));
        onDocumentsChanged?.(next.projectId);
      } catch (err: any) {
        const isAbort = err?.name === "AbortError" || /aborted|cancel/i.test(String(err?.message || ""));
        setUploads((prev) =>
          prev.map((u) =>
            u.id === next.id
              ? {
                  ...u,
                  status: isAbort ? "cancelled" : "failed",
                  error: String(err?.message || "Upload failed"),
                }
              : u,
          ),
        );
      } finally {
        abortersRef.current.delete(next.id);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [profile, uploads, onDocumentsChanged]);

  return {
    uploads,
    queueUpload,
    retryUpload,
    cancelUpload,
    dismissUpload,
    clearCompleted,
  };
}
