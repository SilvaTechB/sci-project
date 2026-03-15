import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  GraduationCap, LogOut, FileText, Clock, CheckCircle, XCircle, 
  Loader2, File, Download, Users, FolderOpen,
  Eye, History, AlertCircle, CalendarDays, Search, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getYearSuffix } from '@/lib/regNoValidation';
import DashboardStats from '@/components/DashboardStats';
import DocumentPreview from '@/components/DocumentPreview';
import DocumentVersionHistory from '@/components/DocumentVersionHistory';
import ProjectComments from '@/components/ProjectComments';
import ProjectDeadline from '@/components/ProjectDeadline';
import MentionNotifications from '@/components/MentionNotifications';

interface GroupMember {
  id: string;
  full_name: string;
  registration_number: string;
}

interface ProjectWithStudent {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  feedback: string | null;
  created_at: string;
  updated_at: string;
  deadline: string | null;
  assigned_lecturer_id: string | null;
  project_type: 'individual' | 'group' | null;
  contribution_type: 'individual' | 'peer' | 'group' | null;
  student: {
    id: string;
    full_name: string;
    registration_number: string;
    course_name: string;
    year_of_study: number;
  };
}

interface ProjectDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  file_size: number | null;
  version: number;
  is_current: boolean;
}

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStudent | null>(null);
  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [feedback, setFeedback] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preview state
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  
  // Version history state
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<{ projectId: string; docType: string } | null>(null);

  // Group members for selected project
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    if (profile) {
      fetchProjects();
    }
  }, [profile]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          student:profiles!projects_student_id_fkey(
            id,
            full_name,
            registration_number,
            course_name,
            year_of_study
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data as unknown as ProjectWithStudent[]) || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (projectId: string) => {
    try {
      const { data } = await supabase
        .from('group_members')
        .select('id, full_name, registration_number')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      setGroupMembers(data || []);
    } catch {
      setGroupMembers([]);
    }
  };

  const fetchProjectDocuments = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('id, document_type, file_name, file_path, uploaded_at, file_size, version, is_current')
        .eq('project_id', projectId)
        .eq('is_current', true)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setProjectDocs(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
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
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download file');
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedProject || !profile) return;

    if (!feedback.trim() && status === 'rejected') {
      toast.error('Please provide feedback when rejecting a project');
      return;
    }

    setReviewing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status,
          feedback: feedback.trim() || null,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id);

      if (error) throw error;

      toast.success(`Project ${status}`);
      setSelectedProject(null);
      setFeedback('');
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update project');
    } finally {
      setReviewing(false);
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

  const filteredProjects = projects.filter(p => {
    const isAssignedToMe = p.assigned_lecturer_id === profile?.id;
    const matchesSearch = !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.student.registration_number.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'pending') return p.status === 'pending' && isAssignedToMe;
    if (activeTab === 'reviewed') return p.status !== 'pending' && isAssignedToMe;
    if (activeTab === 'mine') return isAssignedToMe;
    return true; // 'all' tab shows everything
  });

  const myProjects = projects.filter(p => p.assigned_lecturer_id === profile?.id);
  
  const stats = {
    pending: myProjects.filter(p => p.status === 'pending').length,
    approved: myProjects.filter(p => p.status === 'approved').length,
    rejected: myProjects.filter(p => p.status === 'rejected').length,
    total: myProjects.length,
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
            <span className="text-muted-foreground">Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="app-header relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight gradient-text">SCI Archive</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {profile?.full_name ? profile.full_name.split(' ')[0] : 'Lecturer'} • Lecturer
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <MentionNotifications />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 page-with-nav">
        {/* Stats Cards */}
        <DashboardStats 
          pending={stats.pending}
          approved={stats.approved}
          rejected={stats.rejected}
          total={stats.total}
        />

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, description, student name or reg number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-input border-border"
            data-testid="input-search-projects"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Projects Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Reviewed ({stats.approved + stats.rejected})
            </TabsTrigger>
            <TabsTrigger value="mine" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My Projects ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredProjects.length === 0 ? (
              <Card variant="glass" className="text-center py-16">
                <CardContent>
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending' 
                      ? 'No pending projects to review.'
                      : 'No projects in this category.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <Card 
                    key={project.id} 
                    variant="glass" 
                    className="glass-card-hover cursor-pointer"
                    onClick={() => {
                      setSelectedProject(project);
                      setFeedback(project.feedback || '');
                      setGroupMembers([]);
                      fetchProjectDocuments(project.id);
                      if (project.project_type === 'group') fetchGroupMembers(project.id);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                        <Badge variant={project.status as 'pending' | 'approved' | 'rejected'}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1 capitalize">{project.status}</span>
                        </Badge>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{project.student.full_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.student.registration_number} • {getYearSuffix(project.student.year_of_study)} Year
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {project.student.course_name}
                      </p>
                      {/* Deadline indicator on card */}
                      <div className="mt-3">
                        <ProjectDeadline
                          projectId={project.id}
                          deadline={project.deadline}
                          compact
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Project Review Dialog */}
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <DialogTitle className="font-display pr-4">{selectedProject.title}</DialogTitle>
                    <Badge variant={selectedProject.status as 'pending' | 'approved' | 'rejected'}>
                      {getStatusIcon(selectedProject.status)}
                      <span className="ml-1 capitalize">{selectedProject.status}</span>
                    </Badge>
                  </div>
                  {selectedProject.description && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedProject.description}</p>
                  )}
                </DialogHeader>

                {/* Deadline Section - Lecturers can edit */}
                <ProjectDeadline
                  projectId={selectedProject.id}
                  deadline={selectedProject.deadline}
                  canEdit={true}
                  onDeadlineChange={(deadline) => {
                    setSelectedProject({ ...selectedProject, deadline });
                    setProjects(projects.map(p => 
                      p.id === selectedProject.id ? { ...p, deadline } : p
                    ));
                  }}
                />

                {/* Project Type & Contribution Badges */}
                {(selectedProject.project_type || selectedProject.contribution_type) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.project_type && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border text-muted-foreground capitalize">
                        {selectedProject.project_type === 'group' ? '👥' : '👤'} {selectedProject.project_type}
                      </span>
                    )}
                    {selectedProject.contribution_type && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border text-muted-foreground capitalize">
                        {selectedProject.contribution_type} contribution
                      </span>
                    )}
                  </div>
                )}

                {/* Student Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2">{selectedProject.student.full_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reg No:</span>
                      <span className="ml-2">{selectedProject.student.registration_number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year:</span>
                      <span className="ml-2">{getYearSuffix(selectedProject.student.year_of_study)} Year</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course:</span>
                      <span className="ml-2">{selectedProject.student.course_name}</span>
                    </div>
                  </div>
                </div>

                {/* Group Members */}
                {groupMembers.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Group Members</h4>
                    <div className="space-y-1.5">
                      {groupMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <span>{member.full_name}</span>
                          <span className="text-muted-foreground text-xs">{member.registration_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents with inline preview */}
                <div className="space-y-3">
                  <h4 className="font-medium">Project Documents</h4>
                  {projectDocs.length > 0 ? (
                    <div className="space-y-2">
                      {projectDocs.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <File className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.document_type} • v{doc.version}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setVersionHistoryDoc({ 
                                projectId: selectedProject.id, 
                                docType: doc.document_type 
                              })}
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-muted/30 rounded-lg">
                      <AlertCircle className="w-8 h-8 mx-auto text-warning mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No documents uploaded yet
                      </p>
                    </div>
                )}
                </div>

                {/* Feedback & Actions */}
                {selectedProject.status === 'pending' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <div className="space-y-2">
                      <Label>Feedback / Remarks</Label>
                      <Textarea
                        placeholder="Enter your feedback for the student..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[100px] bg-input border-border"
                      />
                      {!feedback.trim() && (
                        <p className="text-xs text-muted-foreground">
                          Feedback is required when rejecting a project
                        </p>
                      )}
                    </div>
                    
                    <DialogFooter className="flex gap-2">
                      <Button 
                        variant="destructive"
                        onClick={() => handleReview('rejected')}
                        disabled={reviewing || !feedback.trim()}
                      >
                        {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Reject
                      </Button>
                      <Button 
                        variant="success"
                        onClick={() => handleReview('approved')}
                        disabled={reviewing}
                      >
                        {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </Button>
                    </DialogFooter>
                  </div>
                )}

                {/* Show existing feedback for reviewed projects */}
                {selectedProject.status !== 'pending' && selectedProject.feedback && (
                  <div className={`p-4 rounded-lg ${
                    selectedProject.status === 'approved' 
                      ? 'bg-success/10 border border-success/20' 
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}>
                    <p className="text-sm font-medium mb-1">Review Feedback:</p>
                    <p className="text-sm">{selectedProject.feedback}</p>
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-border pt-4">
                  <ProjectComments projectId={selectedProject.id} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Document Preview Modal */}
        <DocumentPreview
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          document={previewDoc}
        />

        {/* Version History Sheet */}
        {versionHistoryDoc && (
          <DocumentVersionHistory
            open={!!versionHistoryDoc}
            onOpenChange={(open) => !open && setVersionHistoryDoc(null)}
            projectId={versionHistoryDoc.projectId}
            documentType={versionHistoryDoc.docType}
            canEdit={false}
            onVersionsChanged={() => selectedProject && fetchProjectDocuments(selectedProject.id)}
            onPreview={(doc) => setPreviewDoc(doc)}
          />
        )}
      </main>
    </div>
  );
};

export default LecturerDashboard;
