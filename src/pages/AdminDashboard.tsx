import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Shield,
  LogOut,
  Search,
  X,
  Loader2,
  Trash2,
  Edit,
  FileText,
  Users,
  FolderOpen,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  BadgeCheck,
  Copy,
  Plus,
  Link2,
  ToggleLeft,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminProject {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  feedback: string | null;
  created_at: string;
  project_type: 'individual' | 'group';
  contribution_type: 'individual' | 'peer' | 'group';
  student: {
    id: string;
    full_name: string;
    registration_number: string | null;
    course_name: string | null;
    year_of_study: number | null;
    email: string;
  } | null;
  assigned_lecturer: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface AdminInvite {
  id: string;
  code: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
  is_active: boolean;
  creator?: { full_name: string } | null;
  user?: { full_name: string } | null;
}

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  registration_number: string | null;
  course_name: string | null;
  year_of_study: number | null;
  can_submit: boolean | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-500 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  // Projects state
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<AdminProject | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [editUserRole, setEditUserRole] = useState<'student' | 'lecturer' | 'admin'>('student');

  // Invites state
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          student:profiles!projects_student_id_fkey(id, full_name, registration_number, course_name, year_of_study, email),
          assigned_lecturer:profiles!projects_assigned_lecturer_id_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data as unknown as AdminProject[]) || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as AdminUser[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.student?.full_name.toLowerCase().includes(q) ||
          (p.student?.registration_number && p.student.registration_number.toLowerCase().includes(q))
      );
    }
    return list;
  }, [projects, searchQuery, statusFilter]);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter(
        u =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.registration_number && u.registration_number.toLowerCase().includes(q))
      );
    }
    return list;
  }, [users, userSearch, roleFilter]);

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    setDeletingProject(true);
    try {
      // Remove storage files first
      const { data: docs } = await supabase
        .from('project_documents')
        .select('file_path')
        .eq('project_id', deleteProjectId);

      if (docs && docs.length > 0) {
        await supabase.storage
          .from('project-documents')
          .remove(docs.map(d => d.file_path));
      }

      const { error } = await supabase.from('projects').delete().eq('id', deleteProjectId);
      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== deleteProjectId));
      if (selectedProject?.id === deleteProjectId) setSelectedProject(null);
      setDeleteProjectId(null);
      toast.success('Project deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setDeletingProject(false);
    }
  };

  const handleChangeStatus = async (
    projectId: string,
    status: 'pending' | 'approved' | 'rejected'
  ) => {
    setChangingStatus(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status, reviewed_by: profile?.id, reviewed_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status } : p));
      if (selectedProject?.id === projectId) setSelectedProject(prev => prev ? { ...prev, status } : null);
      toast.success(`Status changed to ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setDeletingUser(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', deleteUserId);
      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== deleteUserId));
      if (selectedUser?.id === deleteUserId) setSelectedUser(null);
      setDeleteUserId(null);
      toast.success('User removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleEditUserRole = async () => {
    if (!selectedUser) return;
    setEditingUser(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: editUserRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: editUserRole } : u));
      setSelectedUser(prev => prev ? { ...prev, role: editUserRole } : null);
      toast.success('User role updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setEditingUser(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // ─── Invite helpers ───────────────────────────────────────────────────────
  const fetchInvites = async () => {
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_invites')
        .select(`
          id, code, label, created_by, created_at,
          used_by, used_at, is_active,
          creator:profiles!admin_invites_created_by_fkey(full_name),
          user:profiles!admin_invites_used_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvites((data as unknown as AdminInvite[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load invites';
      toast.error(msg);
    } finally {
      setInvitesLoading(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = (n: number) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `ADMIN-${seg(4)}-${seg(4)}`;
  };

  const handleGenerateInvite = async (label?: string) => {
    setGeneratingInvite(true);
    try {
      const code = generateInviteCode();
      const { error } = await supabase.from('admin_invites').insert({
        code,
        label: label || null,
        created_by: profile?.id,
      });
      if (error) throw error;
      toast.success('Invite code created');
      await fetchInvites();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invite';
      toast.error(msg);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    setRevokingInviteId(id);
    try {
      const { error } = await supabase
        .from('admin_invites')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      setInvites(prev => prev.map(i => i.id === id ? { ...i, is_active: false } : i));
      toast.success('Invite code revoked');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke invite';
      toast.error(msg);
    } finally {
      setRevokingInviteId(null);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_invites').delete().eq('id', id);
      if (error) throw error;
      setInvites(prev => prev.filter(i => i.id !== id));
      toast.success('Invite deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete invite';
      toast.error(msg);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
  };

  const stats = {
    totalProjects: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    approved: projects.filter(p => p.status === 'approved').length,
    totalUsers: users.length,
  };

  return (
    <div className="min-h-screen relative">
      <ParticlesBackground />

      {/* Header */}
      <header className="app-header relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight gradient-text">SCI Archive</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {profile?.full_name?.split(' ')[0]}
                </p>
                <span className="text-[10px] font-semibold text-orange-400 leading-tight">• Super Admin</span>
                <BadgeCheck className="w-3 h-3 text-orange-400 shrink-0" />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-6 page-with-nav">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-primary' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-500' },
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} variant="glass">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'invites' && invites.length === 0) fetchInvites();
        }}>
          <TabsList className="glass-card mb-6">
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-4 h-4 mr-1" />
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <KeyRound className="w-4 h-4 mr-1" />
              Invites
            </TabsTrigger>
          </TabsList>

          {/* ─── Projects Tab ─── */}
          <TabsContent value="projects">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by title, description, student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 bg-input border-border"
                  data-testid="admin-search-projects"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-input border-border shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchProjects} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {projectsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card variant="glass" className="text-center py-16">
                <CardContent>
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No projects match your search.' : 'No projects yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    variant="glass"
                    className="glass-card-hover cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                    data-testid={`admin-project-card-${project.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{project.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[project.status]}`}>
                              {project.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                               project.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              {project.status}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize bg-muted/50 px-2 py-0.5 rounded-full">
                              {project.project_type || 'individual'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {project.student?.full_name}
                            {project.student?.registration_number && ` · ${project.student.registration_number}`}
                          </p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); setSelectedProject(project); }}
                            data-testid={`admin-view-project-${project.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteProjectId(project.id); }}
                            data-testid={`admin-delete-project-${project.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Users Tab ─── */}
          <TabsContent value="users">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name, email, or registration number..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-9 bg-input border-border"
                  data-testid="admin-search-users"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 bg-input border-border shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="lecturer">Lecturers</SelectItem>
                  <SelectItem value="admin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchUsers} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card variant="glass" className="text-center py-16">
                <CardContent>
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                  <p className="text-muted-foreground">No users match your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    variant="glass"
                    className="glass-card-hover cursor-pointer"
                    onClick={() => { setSelectedUser(user); setEditUserRole(user.role); }}
                    data-testid={`admin-user-card-${user.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{user.full_name}</span>
                            {user.role === 'admin' ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold">
                                Super Admin
                                <BadgeCheck className="w-3 h-3 shrink-0" />
                              </span>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                user.role === 'lecturer'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                          {user.registration_number && (
                            <p className="text-xs text-muted-foreground">{user.registration_number}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setEditUserRole(user.role); }}
                            data-testid={`admin-edit-user-${user.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.id !== profile?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteUserId(user.id); }}
                              data-testid={`admin-delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Invites Tab ─── */}
          <TabsContent value="invites">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Super Admin Invite Codes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Generate codes to invite others as Super Admin</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={fetchInvites} title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGenerateInvite()}
                  disabled={generatingInvite}
                  data-testid="btn-generate-invite"
                >
                  {generatingInvite ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  Generate Code
                </Button>
              </div>
            </div>

            {/* Hardcoded fallback codes info */}
            <Card variant="glass" className="mb-4 border-orange-500/20 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Built-in fallback code (always active)</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-orange-400 font-mono">SCIARCHIVE-ADMIN-2026</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('SCIARCHIVE-ADMIN-2026')}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="opacity-70">This code is hardcoded and cannot be revoked. Use database codes below for better control.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {invitesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <Card variant="glass" className="text-center py-16">
                <CardContent>
                  <KeyRound className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Invite Codes Yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Generate a code to invite someone as a Super Admin.</p>
                  <Button onClick={() => handleGenerateInvite()} disabled={generatingInvite}>
                    <Plus className="w-4 h-4 mr-1" /> Generate First Code
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <Card
                    key={invite.id}
                    variant="glass"
                    className={invite.is_active && !invite.used_by ? '' : 'opacity-60'}
                    data-testid={`invite-card-${invite.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Code + status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono text-sm font-semibold text-primary tracking-wide">
                              {invite.code}
                            </code>
                            {invite.used_by ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
                                Used
                              </span>
                            ) : invite.is_active ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                Active
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                Revoked
                              </span>
                            )}
                            {invite.label && (
                              <span className="text-xs text-muted-foreground">— {invite.label}</span>
                            )}
                          </div>

                          {/* Meta */}
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(invite.created_at).toLocaleDateString()}
                            {invite.creator && ` by ${(invite.creator as { full_name: string }).full_name}`}
                          </p>
                          {invite.used_by && invite.user && (
                            <p className="text-xs text-muted-foreground">
                              Used by {(invite.user as { full_name: string }).full_name}
                              {invite.used_at && ` on ${new Date(invite.used_at).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {invite.is_active && !invite.used_by && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Copy code"
                                onClick={() => copyToClipboard(invite.code)}
                                data-testid={`btn-copy-invite-${invite.id}`}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Share invite link"
                                onClick={() => copyToClipboard(`Register as Super Admin using invite code: ${invite.code}`)}
                                data-testid={`btn-share-invite-${invite.id}`}
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-yellow-500 hover:text-yellow-500"
                                title="Revoke code"
                                onClick={() => handleRevokeInvite(invite.id)}
                                disabled={revokingInviteId === invite.id}
                                data-testid={`btn-revoke-invite-${invite.id}`}
                              >
                                {revokingInviteId === invite.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <ToggleLeft className="w-3.5 h-3.5" />
                                }
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => handleDeleteInvite(invite.id)}
                            data-testid={`btn-delete-invite-${invite.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>

      {/* ─── Project Detail Dialog ─── */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="glass-card border-border max-h-[85vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display pr-8">{selectedProject.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Status + badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border capitalize ${STATUS_COLORS[selectedProject.status]}`}>
                  {selectedProject.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                   selectedProject.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                   <Clock className="w-3 h-3" />}
                  {selectedProject.status}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted/50 text-muted-foreground border border-border capitalize">
                  {selectedProject.project_type || 'individual'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted/50 text-muted-foreground border border-border capitalize">
                  {selectedProject.contribution_type || 'individual'} contribution
                </span>
              </div>

              {/* Description */}
              {selectedProject.description && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                </div>
              )}

              {/* Student info */}
              {selectedProject.student && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Student</Label>
                  <div className="p-3 rounded-lg bg-muted/30 space-y-1 text-sm">
                    <p className="font-medium">{selectedProject.student.full_name}</p>
                    <p className="text-muted-foreground">{selectedProject.student.email}</p>
                    {selectedProject.student.registration_number && (
                      <p className="text-muted-foreground">{selectedProject.student.registration_number}</p>
                    )}
                    {selectedProject.student.course_name && (
                      <p className="text-muted-foreground">
                        {selectedProject.student.course_name} · Year {selectedProject.student.year_of_study}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Lecturer */}
              {selectedProject.assigned_lecturer && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Assigned Lecturer</Label>
                  <div className="p-3 rounded-lg bg-muted/30 text-sm">
                    <p className="font-medium">{selectedProject.assigned_lecturer.full_name}</p>
                    <p className="text-muted-foreground">{selectedProject.assigned_lecturer.email}</p>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {selectedProject.feedback && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Feedback</Label>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm">{selectedProject.feedback}</p>
                  </div>
                </div>
              )}

              {/* Change Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Change Status</Label>
                <div className="flex gap-2">
                  {(['pending', 'approved', 'rejected'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={selectedProject.status === s ? 'gradient' : 'outline'}
                      size="sm"
                      className="flex-1 capitalize"
                      disabled={changingStatus || selectedProject.status === s}
                      onClick={() => handleChangeStatus(selectedProject.id, s)}
                      data-testid={`admin-status-${s}`}
                    >
                      {changingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { setDeleteProjectId(selectedProject.id); setSelectedProject(null); }}
                data-testid="admin-confirm-delete-project"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Project
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── User Edit Dialog ─── */}
      {selectedUser && !deleteUserId && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="glass-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display">Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/30 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{selectedUser.full_name}</p>
                  {selectedUser.role === 'admin' && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold">
                      Super Admin
                      <BadgeCheck className="w-3 h-3 shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                {selectedUser.registration_number && (
                  <p className="text-muted-foreground">{selectedUser.registration_number}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Change Role</Label>
                <Select
                  value={editUserRole}
                  onValueChange={(v) => setEditUserRole(v as 'student' | 'lecturer' | 'admin')}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                {editUserRole === 'admin' && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <p>This grants full Super Admin access — the user can manage all projects and users.</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              {selectedUser.id !== profile?.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setDeleteUserId(selectedUser.id); setSelectedUser(null); }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove User
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleEditUserRole}
                disabled={editingUser || editUserRole === selectedUser.role}
                data-testid="admin-save-user-role"
              >
                {editingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Delete Project Confirmation ─── */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all uploaded documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deletingProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="admin-confirm-delete"
            >
              {deletingProject ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete User Confirmation ─── */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the user's profile from the system. Their auth account remains active but they will need to complete profile setup on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="admin-confirm-delete-user"
            >
              {deletingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
