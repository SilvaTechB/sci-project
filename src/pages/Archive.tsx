import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ParticlesBackground from '@/components/ParticlesBackground';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  GraduationCap, LogOut, Search, Archive as ArchiveIcon, Download, 
  File, Loader2, Calendar, BookOpen, Filter, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getYearSuffix } from '@/lib/regNoValidation';

interface ArchivedProject {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
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
}

const ITEMS_PER_PAGE = 12;

const Archive = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ArchivedProject | null>(null);
  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  
  // Available filter options
  const [courses, setCourses] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    if (profile) {
      fetchApprovedProjects();
    }
  }, [profile]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, yearFilter]);

  const fetchApprovedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          created_at,
          student:profiles!projects_student_id_fkey(
            id,
            full_name,
            registration_number,
            course_name,
            year_of_study
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const projectsData = (data as unknown as ArchivedProject[]) || [];
      setProjects(projectsData);
      
      // Extract unique courses and years
      const uniqueCourses = [...new Set(projectsData.map(p => p.student.course_name).filter(Boolean))];
      const uniqueYears = [...new Set(projectsData.map(p => p.student.year_of_study).filter(Boolean))].sort((a, b) => a - b);
      
      setCourses(uniqueCourses);
      setYears(uniqueYears);
    } catch (error) {
      console.error('Error fetching archived projects:', error);
      toast.error('Failed to load archive');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.student.full_name.toLowerCase().includes(query) ||
        p.student.registration_number?.toLowerCase().includes(query)
      );
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(p => p.student.course_name === courseFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(p => p.student.year_of_study === parseInt(yearFilter));
    }

    return filtered;
  }, [projects, searchQuery, courseFilter, yearFilter]);

  // Memoized paginated projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery('');
    setCourseFilter('all');
    setYearFilter('all');
  };

  const fetchProjectDocuments = async (projectId: string) => {
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
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const hasActiveFilters = searchQuery || courseFilter !== 'all' || yearFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParticlesBackground />
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <ArchiveIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading archive...</span>
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
              <p className="text-[11px] text-muted-foreground leading-tight">Project Archive</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 page-with-nav">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <ArchiveIcon className="w-6 h-6" />
            Project Archive
          </h2>
          <p className="text-muted-foreground">Browse approved academic projects</p>
        </div>

        {/* Filters */}
        <Card variant="glass" className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, student, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Course Filter */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Course</Label>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Year of Study</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{getYearSuffix(year)} Year</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredProjects.length} of {projects.length} projects
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card variant="glass" className="text-center py-16">
            <CardContent>
              <ArchiveIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'Try adjusting your search filters.'
                  : 'No approved projects in the archive yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedProjects.map((project) => (
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
                    <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>{project.student.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {project.student.course_name} • {getYearSuffix(project.student.year_of_study)} Year
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredProjects.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}

        {/* Project Details Dialog */}
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">{selectedProject.title}</DialogTitle>
                  {selectedProject.description && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedProject.description}</p>
                  )}
                </DialogHeader>

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

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-medium">Project Documents</h4>
                  {projectDocs.length > 0 ? (
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No documents available
                    </p>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Archive;
