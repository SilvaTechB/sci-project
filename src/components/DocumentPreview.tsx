import * as React from "react";
import { ExternalLink, X, Download, Loader2, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    file_path: string;
    document_type: string;
  } | null;
  onDownload?: () => void;
}

type PreviewKind = 'pdf' | 'image' | 'office' | 'other';

function getPreviewKind(fileName: string): PreviewKind {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'office';
  
  return 'other';
}

function getPreviewIcon(kind: PreviewKind) {
  switch (kind) {
    case 'pdf':
      return <FileText className="w-12 h-12 text-destructive" />;
    case 'image':
      return <ImageIcon className="w-12 h-12 text-primary" />;
    case 'office':
      return <FileText className="w-12 h-12 text-primary" />;
    default:
      return <File className="w-12 h-12 text-muted-foreground" />;
  }
}

export default function DocumentPreview({
  open,
  onOpenChange,
  document,
  onDownload,
}: DocumentPreviewProps) {
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !document) {
      setPreviewUrl(null);
      setError(null);
      return;
    }

    const loadPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: urlError } = await supabase.storage
          .from('project-documents')
          .createSignedUrl(document.file_path, 60 * 30); // 30 min

        if (urlError) throw urlError;
        if (!data?.signedUrl) throw new Error('Could not create preview URL');

        setPreviewUrl(data.signedUrl);
      } catch (err: any) {
        console.error('Preview error:', err);
        setError(err.message || 'Failed to load preview');
        toast.error('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [open, document]);

  if (!document) return null;

  const kind = getPreviewKind(document.file_name);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download file');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="font-display truncate flex-1">
              {document.file_name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {previewUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {document.document_type}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          {loading && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              {getPreviewIcon(kind)}
              <p className="text-destructive mt-4">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download instead
              </Button>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <>
              {kind === 'pdf' && (
                <iframe
                  title={`Preview of ${document.file_name}`}
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg border border-border bg-background"
                />
              )}

              {kind === 'image' && (
                <div className="flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={`Preview of ${document.file_name}`}
                    className="max-w-full max-h-[70vh] rounded-lg object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {kind === 'office' && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  {getPreviewIcon(kind)}
                  <p className="text-muted-foreground mt-4 mb-2">
                    Office document preview is not available in browser.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download or open externally to view this file.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <a href={previewUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open in new tab
                      </a>
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {kind === 'other' && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  {getPreviewIcon(kind)}
                  <p className="text-muted-foreground mt-4 mb-4">
                    Preview is not available for this file type.
                  </p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
