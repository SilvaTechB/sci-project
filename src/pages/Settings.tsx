import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  GraduationCap, LogOut, Settings as SettingsIcon, User, Mail, 
  Key, Loader2, Save, ArrowLeft, Shield, Trash2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { getYearSuffix } from '@/lib/regNoValidation';

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeletingAccount(true);
    try {
      if (profile?.id) {
        // Delete project documents first (from storage and database)
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('student_id', profile.id);

        if (projects && projects.length > 0) {
          for (const project of projects) {
            // Get document file paths
            const { data: docs } = await supabase
              .from('project_documents')
              .select('file_path')
              .eq('project_id', project.id);

            // Delete files from storage
            if (docs && docs.length > 0) {
              const filePaths = docs.map(d => d.file_path);
              await supabase.storage
                .from('project-documents')
                .remove(filePaths);
            }

            // Delete document records
            await supabase
              .from('project_documents')
              .delete()
              .eq('project_id', project.id);
          }

          // Delete projects
          await supabase
            .from('projects')
            .delete()
            .eq('student_id', profile.id);
        }

        // Delete profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (profileError) {
          throw new Error('Failed to delete profile: ' + profileError.message);
        }
      }

      // Sign out
      await signOut();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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
              <p className="text-[11px] text-muted-foreground leading-tight">Account Settings</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 max-w-2xl page-with-nav">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Account Settings
          </h2>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                {/* Read-only info for students */}
                {profile?.role === 'student' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Registration Number</Label>
                      <p className="text-sm font-medium">{profile?.registration_number || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Year of Study</Label>
                      <p className="text-sm font-medium">{profile?.year_of_study ? getYearSuffix(profile.year_of_study) + ' Year' : '-'}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Course</Label>
                      <p className="text-sm font-medium">{profile?.course_name || '-'}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Submission Status</Label>
                      <p className={`text-sm font-medium ${profile?.can_submit ? 'text-success' : 'text-warning'}`}>
                        {profile?.can_submit ? '✓ Eligible to submit projects' : '✗ Not eligible to submit projects'}
                      </p>
                    </div>
                  </div>
                )}

                {profile?.role === 'lecturer' && (
                  <div className="pt-4 border-t border-border">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Role</Label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Lecturer / Reviewer
                      </p>
                    </div>
                  </div>
                )}

                <Button type="submit" variant="gradient" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>

                <Button type="submit" variant="outline" disabled={changingPassword || !passwordData.newPassword}>
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Created</span>
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card variant="glass" className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. All your data, projects, and submissions will be permanently removed.
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-5 h-5" />
                          Delete Account Permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                          </p>
                          <div className="space-y-2">
                            <Label>Type <span className="font-bold text-destructive">DELETE</span> to confirm:</Label>
                            <Input
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder="Type DELETE"
                              className="border-destructive/50"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== 'DELETE' || deletingAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingAccount ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Forever'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
