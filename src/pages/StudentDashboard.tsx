import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  LogOut,
  Upload,
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  File,
  AlertCircle,
  Settings,
  Archive,
  User,
  Download,
  Eye,
  ExternalLink,
  X,
  PanelRight,
  CalendarDays,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getYearSuffix } from '@/lib/regNoValidation';
import DashboardStats from '@/components/DashboardStats';
import UploadCenter from '@/components/UploadCenter';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import ProjectComments from '@/components/ProjectComments';
import ProjectDeadline from '@/components/ProjectDeadline';
import MentionNotifications from '@/components/MentionNotifications';

interface Lecturer {
  id: string;
  full_name: string;
  email: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  feedback: string | null;
  created_at: string;
  updated_at: string;
  deadline: string | null;
  assigned_lecturer_id: string | null;
  assigned_lecturer?: Lecturer | null;
}

interface ProjectDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

type UploadStatus = 'queued' | 'uploading' | 'success' | 'failed' | 'cancelled' | 'validating';

interface UploadItem {
  id: string;
  projectId: string;
  docType: string;
  fileName: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const REQUIRED_DOCUMENTS = ['PRD', 'SDD', 'Final Report'];
const OPTIONAL_DOCUMENTS = ['Supporting Files'];
const ALL_DOCUMENT_TYPES = [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS];

const normalizeForId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const getUploadInputId = (projectId: string, docType: string) => `upload-${projectId}-${normalizeForId(docType)}`;

const getPreviewKind = (fileName: string): 'pdf' | 'image' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  return 'other';
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', assignedLecturerId: '' });
  const [uploading, setUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [uploadCenterOpen, setUploadCenterOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    doc: ProjectDocument;
    url: string;
    kind: 'pdf' | 'image' | 'other';
  } | null>(null);
  
  // Edit project state
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState({ title: '', description: '', assignedLecturerId: '' });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete project state
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchProjectDocuments(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setProjectDocs(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  const { uploads, queueUpload, retryUpload, cancelUpload, dismissUpload, clearCompleted } = useUploadQueue({
    profile,
    onDocumentsChanged: (projectId) => fetchProjectDocuments(projectId),
  });

  const queueWithValidation = (projectId: string, docType: string, file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`);
      return;
    }

    queueUpload({ projectId, docType, file });
    setUploadCenterOpen(true);
  };

  useEffect(() => {
    if (profile) {
      fetchProjects();
      fetchLecturers();
    }
  }, [profile]);

  const fetchLecturers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'lecturer')
        .order('full_name');

      if (error) throw error;
      setLecturers(data || []);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  };

  const fetchProjects = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          assigned_lecturer:profiles!projects_assigned_lecturer_id_fkey(id, full_name, email)
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateProject = async () => {
    if (!profile?.can_submit) {
      toast.error('You are not eligible to submit projects');
      return;
    }

    if (!newProject.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    if (!newProject.assignedLecturerId) {
      toast.error('Please select a lecturer to review your project');
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          student_id: profile.id,
          title: newProject.title,
          description: newProject.description || null,
          assigned_lecturer_id: newProject.assignedLecturerId,
        })
        .select(`
          *,
          assigned_lecturer:profiles!projects_assigned_lecturer_id_fkey(id, full_name, email)
        `)
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setNewProject({ title: '', description: '', assignedLecturerId: '' });
      setIsNewProjectOpen(false);
      toast.success('Project created! Now upload your documents.');
      setSelectedProject(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProject({
      title: project.title,
      description: project.description || '',
      assignedLecturerId: project.assigned_lecturer_id || '',
    });
    setIsEditProjectOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProjectId || !editProject.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    if (!editProject.assignedLecturerId) {
      toast.error('Please select a lecturer');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          title: editProject.title.trim(),
          description: editProject.description.trim() || null,
          assigned_lecturer_id: editProject.assignedLecturerId,
        })
        .eq('id', editingProjectId)
        .select(`
          *,
          assigned_lecturer:profiles!projects_assigned_lecturer_id_fkey(id, full_name, email)
        `)
        .single();

      if (error) throw error;

      setProjects(projects.map(p => p.id === editingProjectId ? data : p));
      if (selectedProject?.id === editingProjectId) {
        setSelectedProject(data);
      }
      setIsEditProjectOpen(false);
      setEditingProjectId(null);
      toast.success('Project updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;

    setDeleting(true);
    try {
      // First delete all documents from storage
      const { data: docs } = await supabase
        .from('project_documents')
        .select('file_path')
        .eq('project_id', deleteProjectId);

      if (docs && docs.length > 0) {
        const filePaths = docs.map(d => d.file_path);
        await supabase.storage.from('project-documents').remove(filePaths);
      }

      // Then delete the project (will cascade delete documents and comments)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteProjectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== deleteProjectId));
      if (selectedProject?.id === deleteProjectId) {
        setSelectedProject(null);
      }
      setDeleteProjectId(null);
      toast.success('Project deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (projectId: string, docType: string, file: File) => {
    if (!profile) return;
    queueWithValidation(projectId, docType, file);
  };

  const handleDownloadDocument = async (doc: ProjectDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handlePreviewDocument = async (doc: ProjectDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(doc.file_path, 60 * 10);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Could not create preview link');

      setPreviewDoc({ doc, url: data.signedUrl, kind: getPreviewKind(doc.file_name) });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load preview');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    pending: projects.filter(p => p.status === 'pending').length,
    approved: projects.filter(p => p.status === 'approved').length,
    rejected: projects.filter(p => p.status === 'rejected').length,
    total: projects.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParticlesBackground />
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading your projects...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg gradient-text">SCI Archive</h1>
              <p className="text-xs text-muted-foreground">Student Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MentionNotifications />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/archive">
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Link>
            </Button>
            <div className="text-right hidden sm:block ml-2">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.year_of_study && getYearSuffix(profile.year_of_study)} Year • {profile?.course_name}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Can Submit Notice */}
        {!profile?.can_submit && (
          <Card variant="glass" className="mb-6 border-warning/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Limited Access</p>
                <p className="text-sm text-muted-foreground">
                  Only 3rd and 5th year students can submit projects. You can view existing submissions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {projects.length > 0 && (
          <DashboardStats 
            pending={stats.pending}
            approved={stats.approved}
            rejected={stats.rejected}
            total={stats.total}
          />
        )}

        {/* Header with Create Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">My Projects</h2>
            <p className="text-muted-foreground">Manage your academic project submissions</p>
          </div>
          
          {profile?.can_submit && (
            <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project Title <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Enter project title"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Brief description of your project"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="min-h-[100px] bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Lecturer <span className="text-destructive">*</span></Label>
                    <Select
                      value={newProject.assignedLecturerId}
                      onValueChange={(value) => setNewProject({ ...newProject, assignedLecturerId: value })}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select a lecturer to review your project" />
                      </SelectTrigger>
                      <SelectContent>
                        {lecturers.map((lecturer) => (
                          <SelectItem key={lecturer.id} value={lecturer.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{lecturer.full_name}</span>
                              <span className="text-xs text-muted-foreground">({lecturer.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This lecturer will be responsible for reviewing and approving your project
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>Cancel</Button>
                  <Button variant="gradient" onClick={handleCreateProject} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card variant="glass" className="text-center py-16">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4">
                {profile?.can_submit 
                  ? 'Start by creating your first project submission.'
                  : 'You currently have no project submissions.'}
              </p>
              {profile?.can_submit && (
                <Button variant="gradient" onClick={() => setIsNewProjectOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                variant="glass" 
                className="glass-card-hover cursor-pointer"
                onClick={() => {
                  setSelectedProject(project);
                  fetchProjectDocuments(project.id);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{project.title}</CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={project.status as 'pending' | 'approved' | 'rejected'}>
                        {getStatusIcon(project.status)}
                        <span className="ml-1 capitalize">{project.status}</span>
                      </Badge>
                      {project.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteProjectId(project.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                  {project.assigned_lecturer && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>Assigned to: {project.assigned_lecturer.full_name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    <ProjectDeadline
                      projectId={project.id}
                      deadline={project.deadline}
                      compact
                    />
                  </div>
                  {project.status === 'pending' && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>Click to upload documents</span>
                    </div>
                  )}
                  {project.feedback && project.status !== 'pending' && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium mb-1">Feedback:</p>
                      <p className="text-sm text-muted-foreground">{project.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Project Details Dialog */}
        <Dialog
          open={!!selectedProject}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProject(null);
              setPreviewDoc(null);
            }
          }}
        >
          <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-2">
                    <DialogTitle className="font-display pr-4">{selectedProject.title}</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedProject.status as 'pending' | 'approved' | 'rejected'}>
                        {getStatusIcon(selectedProject.status)}
                        <span className="ml-1 capitalize">{selectedProject.status}</span>
                      </Badge>
                      {selectedProject.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProject(selectedProject)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteProjectId(selectedProject.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  {selectedProject.description && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedProject.description}</p>
                  )}
                  {selectedProject.assigned_lecturer && (
                    <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-muted/50">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Reviewer:</span>{' '}
                        <span className="font-medium">{selectedProject.assigned_lecturer.full_name}</span>
                      </span>
                    </div>
                  )}
                </DialogHeader>

                {/* Deadline Section */}
                <ProjectDeadline
                  projectId={selectedProject.id}
                  deadline={selectedProject.deadline}
                  onDeadlineChange={(deadline) => {
                    setSelectedProject({ ...selectedProject, deadline });
                    setProjects(projects.map(p => 
                      p.id === selectedProject.id ? { ...p, deadline } : p
                    ));
                  }}
                />
                {/* Feedback Section */}
                {selectedProject.feedback && selectedProject.status !== 'pending' && (
                  <div className={`p-4 rounded-lg ${
                    selectedProject.status === 'approved' 
                      ? 'bg-success/10 border border-success/20' 
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}>
                    <p className="text-sm font-medium mb-1">Reviewer Feedback:</p>
                    <p className="text-sm">{selectedProject.feedback}</p>
                  </div>
                )}

                {/* Documents Section */}
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">Project Documents</h3>
                    {selectedProject.status === 'pending' && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setUploadCenterOpen(true)}>
                        <PanelRight className="w-4 h-4 mr-1" />
                        Upload Center
                      </Button>
                    )}
                  </div>
                  
                  {/* Required Documents Status */}
                  {(() => {
                    const uploadedTypes = projectDocs.map(doc => doc.document_type);
                    const missingRequired = REQUIRED_DOCUMENTS.filter(doc => !uploadedTypes.includes(doc));
                    const hasAllRequired = missingRequired.length === 0;
                    
                    return (
                      <>
                        {!hasAllRequired && (
                          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-warning">Required Documents Missing</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Please upload: {missingRequired.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {hasAllRequired && selectedProject.status === 'pending' && (
                          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-success" />
                              <p className="text-sm font-medium text-success">All required documents uploaded!</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {selectedProject.status === 'pending' && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: {MAX_FILE_SIZE_MB}MB. Accepted formats: PDF, Word, PowerPoint, ZIP
                      </p>
                      
                      {/* Required Documents */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          Required Documents <span className="text-destructive">*</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {REQUIRED_DOCUMENTS.map((docType) => {
                            const isUploaded = projectDocs.some(doc => doc.document_type === docType);
                            const inputId = selectedProject ? getUploadInputId(selectedProject.id, docType) : undefined;

                            return (
                              <div key={docType} className="relative">
                                <input
                                  type="file"
                                  id={inputId}
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(selectedProject.id, docType, file);
                                    e.currentTarget.value = '';
                                  }}
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                />
                                <label
                                  htmlFor={inputId}
                                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                                    isUploaded 
                                      ? 'border-success/50 bg-success/10 text-success' 
                                      : 'border-dashed border-border hover:border-primary/50'
                                  }`}
                                >
                                  {isUploaded ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  {isUploaded ? `${docType} ✓` : `Upload ${docType}`}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Optional Documents */}
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">
                          Optional Documents
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {OPTIONAL_DOCUMENTS.map((docType) => {
                            const isUploaded = projectDocs.some(doc => doc.document_type === docType);
                            const inputId = selectedProject ? getUploadInputId(selectedProject.id, docType) : undefined;

                            return (
                              <div key={docType} className="relative">
                                <input
                                  type="file"
                                  id={inputId}
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(selectedProject.id, docType, file);
                                    e.currentTarget.value = '';
                                  }}
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                />
                                <label
                                  htmlFor={inputId}
                                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                                    isUploaded 
                                      ? 'border-success/50 bg-success/10 text-success' 
                                      : 'border-dashed border-border hover:border-primary/50'
                                  }`}
                                >
                                  {isUploaded ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  {isUploaded ? `${docType} ✓` : `Upload ${docType}`}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                   {(() => {
                     const items = selectedProject
                       ? uploads
                           .filter((u) => u.projectId === selectedProject.id)
                           .slice(-4)
                           .reverse()
                       : [];

                     if (items.length === 0) return null;

                     const statusLabel = (s: UploadStatus) => {
                       switch (s) {
                         case 'queued':
                           return 'Queued';
                         case 'uploading':
                           return 'Uploading';
                         case 'success':
                           return 'Uploaded';
                         case 'failed':
                           return 'Failed';
                         case 'cancelled':
                           return 'Cancelled';
                       }
                     };

                     return (
                       <div className="space-y-2">
                         {items.map((u) => (
                           <div key={u.id} className="p-3 rounded-lg border border-border bg-muted/30">
                             <div className="flex items-start justify-between gap-3">
                               <div className="min-w-0">
                                 <p className="text-sm font-medium truncate">{u.fileName}</p>
                                 <p className="text-xs text-muted-foreground">
                                   {u.docType} • {statusLabel(u.status)}
                                   {u.status === 'uploading' ? ` • ${u.progress}%` : ''}
                                 </p>
                               </div>

                               <div className="flex items-center gap-1">
                                 {u.status === 'failed' && (
                                   <Button type="button" variant="outline" size="sm" onClick={() => retryUpload(u.id)}>
                                     Retry
                                   </Button>
                                 )}
                                 {u.status === 'uploading' && (
                                   <Button type="button" variant="outline" size="sm" onClick={() => cancelUpload(u.id)}>
                                     Cancel
                                   </Button>
                                 )}
                                 <Button
                                   type="button"
                                   variant="ghost"
                                   size="icon"
                                   onClick={() => dismissUpload(u.id)}
                                   className="h-8 w-8"
                                   aria-label="Dismiss upload"
                                 >
                                   <X className="w-4 h-4" />
                                 </Button>
                               </div>
                             </div>

                             <div className="mt-2">
                               <Progress value={u.status === 'queued' ? 0 : u.progress} className="h-2" />
                             </div>

                             {u.status === 'failed' && u.error && (
                               <p className="mt-2 text-xs text-muted-foreground break-words">{u.error}</p>
                             )}
                           </div>
                         ))}
                       </div>
                     );
                   })()}

                  {/* Preview */}
                  {previewDoc && (
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-medium truncate">
                          Preview: {previewDoc.doc.file_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={previewDoc.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(null)}>
                            Close
                          </Button>
                        </div>
                      </div>

                      {previewDoc.kind === 'pdf' && (
                        <iframe
                          title={`Preview ${previewDoc.doc.file_name}`}
                          src={previewDoc.url}
                          className="w-full h-[60vh] rounded-md bg-background"
                        />
                      )}

                      {previewDoc.kind === 'image' && (
                        <img
                          src={previewDoc.url}
                          alt={`Preview of ${previewDoc.doc.file_name}`}
                          className="w-full max-h-[60vh] object-contain rounded-md bg-background"
                          loading="lazy"
                        />
                      )}

                      {previewDoc.kind === 'other' && (
                        <p className="text-sm text-muted-foreground">
                          Preview isn’t available for this file type. Use Open or Download.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Uploaded Documents List */}
                  {projectDocs.length > 0 && (
                    <div className="space-y-2">
                      {projectDocs.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <File className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewDocument(doc)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {projectDocs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No documents uploaded yet
                    </p>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t border-border pt-4">
                  <ProjectComments projectId={selectedProject.id} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <UploadCenter
          open={uploadCenterOpen}
          onOpenChange={setUploadCenterOpen}
          project={selectedProject}
          projectDocs={projectDocs}
          uploads={uploads}
          requiredDocTypes={REQUIRED_DOCUMENTS}
          optionalDocTypes={OPTIONAL_DOCUMENTS}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
          maxFileSizeLabel={`${MAX_FILE_SIZE_MB}MB`}
          onQueueUpload={(docType, file) => {
            if (!selectedProject) return;
            queueWithValidation(selectedProject.id, docType, file);
          }}
          onRetry={retryUpload}
          onCancel={cancelUpload}
          onDismiss={dismissUpload}
          onClearCompleted={clearCompleted}
          onPreview={(doc) => handlePreviewDocument(doc as any)}
          onDownload={(doc) => handleDownloadDocument(doc as any)}
        />

        {/* Edit Project Dialog */}
        <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Title <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Enter project title"
                  value={editProject.title}
                  onChange={(e) => setEditProject({ ...editProject, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Brief description of your project"
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  className="min-h-[100px] bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign Lecturer <span className="text-destructive">*</span></Label>
                <Select
                  value={editProject.assignedLecturerId}
                  onValueChange={(value) => setEditProject({ ...editProject, assignedLecturerId: value })}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select a lecturer to review your project" />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{lecturer.full_name}</span>
                          <span className="text-xs text-muted-foreground">({lecturer.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditProjectOpen(false)}>Cancel</Button>
              <Button variant="gradient" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Project Confirmation */}
        <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
          <AlertDialogContent className="glass-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this project along with all its documents and comments. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteProject}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default StudentDashboard;
