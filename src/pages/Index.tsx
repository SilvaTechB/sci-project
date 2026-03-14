import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Upload, CheckCircle, Users, Shield, Archive, ArrowRight, Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === 'lecturer' ? '/lecturer' : '/student', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full animate-pulse" />
        </div>
        <div className="relative z-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if logged in (will redirect)
  if (user && profile) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticlesBackground />
      
      {/* Hero Section */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">SCI Archive</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              School of Computing & Informatics
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight">
              Student Project{' '}
              <span className="gradient-text">Archive System</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A modern, secure platform for submitting, reviewing, and archiving 
              academic project documents. Built for students and lecturers.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="xl" asChild className="group">
                <Link to="/register">
                  Start Submitting
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/login">Sign In to Account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Streamlined Project Management
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to submit, review, and archive academic projects in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card variant="glass" className="glass-card-hover animate-slide-up">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">Easy Document Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Upload PRDs, SDDs, final reports, and supporting files with a simple drag-and-drop interface.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card-hover animate-slide-up delay-100">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">Review & Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Lecturers can review, approve, or reject submissions with detailed feedback.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card-hover animate-slide-up delay-200">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Archive className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">Secure Archive</h3>
                <p className="text-sm text-muted-foreground">
                  Approved projects are permanently archived for institutional reference.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card-hover animate-slide-up delay-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">Smart Validation</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic eligibility checking based on registration number and year of study.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card-hover animate-slide-up delay-400">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">
                  Separate dashboards for students and lecturers with appropriate permissions.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card-hover animate-slide-up delay-400">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">Course Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic course and year detection from registration numbers.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <Card variant="glass" className="max-w-3xl mx-auto text-center p-8 md:p-12 glow">
            <CardContent className="p-0">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Ready to Submit Your Project?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join the SCI Archive and start managing your academic project submissions today.
              </p>
              <Button variant="gradient" size="lg" asChild>
                <Link to="/register">Create Your Account</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="font-display font-semibold">SCI Archive</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2026 School of Computing & Informatics. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
