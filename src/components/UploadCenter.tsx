import * as React from "react";
import { Upload, X, RefreshCcw, Ban, File, Eye, Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { UploadItem, UploadStatus } from "@/hooks/useUploadQueue";

interface ProjectLike {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
}

interface ProjectDocumentLike {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

function statusLabel(s: UploadStatus) {
  switch (s) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "success":
      return "Uploaded";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}

function UploadDocRow(props: {
  docType: string;
  isUploaded: boolean;
  accept: string;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const { docType, isUploaded, accept, disabled, onPick } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{docType}</p>
        <p className="text-xs text-muted-foreground">
          {isUploaded ? "Already uploaded — you can upload again to replace." : "Not uploaded yet"}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant={isUploaded ? "outline" : "gradient"}
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          Select file
        </Button>
      </div>
    </div>
  );
}

export default function UploadCenter(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectLike | null;
  projectDocs: ProjectDocumentLike[];
  uploads: UploadItem[];
  requiredDocTypes: string[];
  optionalDocTypes: string[];
  accept: string;
  maxFileSizeLabel: string;

  onQueueUpload: (docType: string, file: File) => void;
  onRetry: (uploadId: string) => void;
  onCancel: (uploadId: string) => void;
  onDismiss: (uploadId: string) => void;
  onClearCompleted: () => void;

  onPreview: (doc: ProjectDocumentLike) => void;
  onDownload: (doc: ProjectDocumentLike) => void;
}) {
  const {
    open,
    onOpenChange,
    project,
    projectDocs,
    uploads,
    requiredDocTypes,
    optionalDocTypes,
    accept,
    maxFileSizeLabel,
    onQueueUpload,
    onRetry,
    onCancel,
    onDismiss,
    onClearCompleted,
    onPreview,
    onDownload,
  } = props;

  const uploadedTypes = React.useMemo(() => new Set(projectDocs.map((d) => d.document_type)), [projectDocs]);

  const scopedUploads = React.useMemo(() => {
    if (!project) return [];
    return uploads
      .filter((u) => u.projectId === project.id)
      .slice()
      .reverse();
  }, [uploads, project]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <div className="p-6">
          <SheetHeader>
            <SheetTitle className="font-display">Upload Center</SheetTitle>
            <SheetDescription>
              {project
                ? `Manage uploads for “${project.title}”. If your browser asks for file access, tap Allow.`
                : "Select a project first."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Separator />

        <div className="p-6 space-y-6">
          {/* Upload actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Upload documents</h3>
              <p className="text-xs text-muted-foreground">Max size: {maxFileSizeLabel}</p>
            </div>

            {!project ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Open a project to start uploading documents.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Required</p>
                  {requiredDocTypes.map((docType) => (
                    <UploadDocRow
                      key={docType}
                      docType={docType}
                      isUploaded={uploadedTypes.has(docType)}
                      accept={accept}
                      onPick={(file) => onQueueUpload(docType, file)}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Optional</p>
                  {optionalDocTypes.map((docType) => (
                    <UploadDocRow
                      key={docType}
                      docType={docType}
                      isUploaded={uploadedTypes.has(docType)}
                      accept={accept}
                      onPick={(file) => onQueueUpload(docType, file)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Upload queue</h3>
              <Button type="button" variant="ghost" size="sm" onClick={onClearCompleted}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear completed
              </Button>
            </div>

            {scopedUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploads yet.</p>
            ) : (
              <div className="space-y-2">
                {scopedUploads.map((u) => (
                  <div key={u.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.docType} • {statusLabel(u.status)}
                          {u.status === "uploading" ? ` • ${u.progress}%` : ""}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {u.status === "failed" && (
                          <Button type="button" variant="outline" size="sm" onClick={() => onRetry(u.id)}>
                            <RefreshCcw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        )}
                        {u.status === "uploading" && (
                          <Button type="button" variant="outline" size="sm" onClick={() => onCancel(u.id)}>
                            <Ban className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDismiss(u.id)}
                          aria-label="Dismiss upload"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <Progress value={u.status === "queued" ? 0 : u.progress} className="h-2" />
                    </div>

                    {u.error && u.status !== "success" && (
                      <p className="mt-2 text-xs text-muted-foreground break-words">{u.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Uploaded files (history)</h3>

            {!project ? (
              <p className="text-sm text-muted-foreground">Open a project to see uploaded files.</p>
            ) : projectDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {projectDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <File className="w-4 h-4 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.document_type}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onPreview(doc)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onDownload(doc)}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
