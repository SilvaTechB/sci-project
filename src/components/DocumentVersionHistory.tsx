import * as React from "react";
import { History, Download, RotateCcw, Trash2, Eye, Loader2, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentVersion {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  version: number;
  is_current: boolean;
}

interface DocumentVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  documentType: string;
  canEdit: boolean;
  onVersionsChanged: () => void;
  onPreview: (doc: DocumentVersion) => void;
}

export default function DocumentVersionHistory({
  open,
  onOpenChange,
  projectId,
  documentType,
  canEdit,
  onVersionsChanged,
  onPreview,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<DocumentVersion | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (open && projectId && documentType) {
      fetchVersions();
    }
  }, [open, projectId, documentType]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('id, document_type, file_name, file_path, file_size, uploaded_at, version, is_current')
        .eq('project_id', projectId)
        .eq('document_type', documentType)
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err: any) {
      console.error('Error fetching versions:', err);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    if (!canEdit) return;
    
    setRestoring(version.id);
    try {
      // Mark all versions as non-current
      const { error: updateError } = await supabase
        .from('project_documents')
        .update({ is_current: false })
        .eq('project_id', projectId)
        .eq('document_type', documentType);

      if (updateError) throw updateError;

      // Mark selected version as current
      const { error: restoreError } = await supabase
        .from('project_documents')
        .update({ is_current: true })
        .eq('id', version.id);

      if (restoreError) throw restoreError;

      toast.success(`Restored version ${version.version}`);
      fetchVersions();
      onVersionsChanged();
    } catch (err: any) {
      console.error('Error restoring version:', err);
      toast.error(err.message || 'Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !canEdit) return;

    setDeleting(true);
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([deleteConfirm.file_path]);

      if (storageError) {
        console.warn('Storage delete warning:', storageError);
        // Continue anyway - file might already be deleted
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', deleteConfirm.id);

      if (dbError) throw dbError;

      // If we deleted the current version, make the latest remaining one current
      if (deleteConfirm.is_current) {
        const remaining = versions.filter(v => v.id !== deleteConfirm.id);
        if (remaining.length > 0) {
          const latest = remaining[0];
          await supabase
            .from('project_documents')
            .update({ is_current: true })
            .eq('id', latest.id);
        }
      }

      toast.success('Version deleted');
      setDeleteConfirm(null);
      fetchVersions();
      onVersionsChanged();
    } catch (err: any) {
      console.error('Error deleting version:', err);
      toast.error(err.message || 'Failed to delete version');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (version: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download file');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle className="font-display flex items-center gap-2">
                <History className="w-5 h-5" />
                Version History
              </SheetTitle>
              <SheetDescription>
                {documentType} — {versions.length} version{versions.length !== 1 ? 's' : ''}
              </SheetDescription>
            </SheetHeader>
          </div>

          <Separator />

          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No versions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`rounded-lg border p-4 ${
                      version.is_current
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">v{version.version}</span>
                          {version.is_current && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {version.file_name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(version.uploaded_at)}
                          </span>
                          <span>{formatSize(version.file_size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(version)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(version)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      {canEdit && !version.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(version)}
                          disabled={!!restoring}
                        >
                          {restoring === version.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 mr-1" />
                          )}
                          Restore
                        </Button>
                      )}
                      {canEdit && versions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(version)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete version {deleteConfirm?.version} ({deleteConfirm?.file_name}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
