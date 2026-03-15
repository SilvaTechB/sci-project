import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ParticlesBackground from '@/components/ParticlesBackground';
import { GraduationCap, Eye, EyeOff, Loader2, Shield, CheckCircle, XCircle, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { validateRegistrationNumber, validateStaffId } from '@/lib/regNoValidation';

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile completion state (shown when user has auth but no profile)
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string>('');
  const [loggedInEmail, setLoggedInEmail] = useState<string>('');
  const ADMIN_INVITE_CODE = 'SCIARCHIVE-ADMIN-2026';
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    role: 'student' as 'student' | 'lecturer' | 'admin',
    registrationNumber: '',
    staffId: '',
    adminCode: '',
  });
  const [cpDbInviteValid, setCpDbInviteValid] = useState<boolean | null>(null);

  // Redirect if already fully logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const dest = profile.role === 'admin' ? '/admin' : profile.role === 'lecturer' ? '/lecturer' : '/student';
      navigate(dest, { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.toLowerCase().includes('not confirmed') ||
            error.message.toLowerCase().includes('email not confirmed')) {
          toast.error('Your email is not confirmed yet. Check your inbox for the confirmation link.', { duration: 8000 });
        } else if (error.message.toLowerCase().includes('invalid login') ||
                   error.message.toLowerCase().includes('invalid credentials')) {
          toast.error('Incorrect email or password. Please try again.');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          toast.error('Failed to load profile. Please try again.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!profileData) {
          // Auth account exists but profile was never created — show inline completion form
          setLoggedInUserId(data.user.id);
          setLoggedInEmail(data.user.email ?? email);
          setNeedsProfile(true);
          setLoading(false);
          return;
        }

        toast.success('Welcome back!');
        setLoading(false);
        const dest = profileData.role === 'admin' ? '/admin' : profileData.role === 'lecturer' ? '/lecturer' : '/student';
        navigate(dest, { replace: true });
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // DB invite validation for profile completion form
  useEffect(() => {
    const code = profileForm.adminCode.trim().toUpperCase();
    if (profileForm.role !== 'admin' || !code || code === ADMIN_INVITE_CODE) {
      setCpDbInviteValid(null);
      return;
    }
    if (code.length < 8) { setCpDbInviteValid(null); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('admin_invites')
        .select('id')
        .eq('code', code)
        .eq('is_active', true)
        .is('used_by', null)
        .maybeSingle();
      setCpDbInviteValid(!!data);
    }, 500);
    return () => clearTimeout(timer);
  }, [profileForm.adminCode, profileForm.role]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let regNoValidation = null;
      let staffIdValidation = null;
      let dbInviteId: string | null = null;

      if (profileForm.role === 'student') {
        regNoValidation = validateRegistrationNumber(profileForm.registrationNumber);
        if (!regNoValidation.isValid) {
          toast.error(regNoValidation.error || 'Invalid registration number');
          setLoading(false);
          return;
        }
      } else if (profileForm.role === 'lecturer') {
        staffIdValidation = validateStaffId(profileForm.staffId);
        if (!staffIdValidation.isValid) {
          toast.error(staffIdValidation.error || 'Invalid staff ID');
          setLoading(false);
          return;
        }
      } else if (profileForm.role === 'admin') {
        const code = profileForm.adminCode.trim().toUpperCase();
        if (code !== ADMIN_INVITE_CODE) {
          const { data } = await supabase
            .from('admin_invites')
            .select('id')
            .eq('code', code)
            .eq('is_active', true)
            .is('used_by', null)
            .maybeSingle();
          if (!data) {
            toast.error('Invalid or expired Super Admin verification code');
            setLoading(false);
            return;
          }
          dbInviteId = data.id;
        }
      }

      const profileData = {
        user_id: loggedInUserId,
        full_name: profileForm.fullName,
        email: loggedInEmail,
        role: profileForm.role,
        registration_number: profileForm.role === 'student'
          ? profileForm.registrationNumber.toUpperCase()
          : profileForm.role === 'lecturer'
          ? profileForm.staffId
          : null,
        course_name: profileForm.role === 'student' ? regNoValidation?.courseName : null,
        year_of_study: profileForm.role === 'student' ? regNoValidation?.yearOfStudy : null,
        can_submit: profileForm.role === 'student' ? (regNoValidation?.canSubmit ?? false) : false,
      };

      const { error: profileError } = await supabase.from('profiles').insert(profileData);

      if (profileError) {
        toast.error('Failed to create profile: ' + profileError.message);
        setLoading(false);
        return;
      }

      // Mark DB invite as used
      if (dbInviteId) {
        await supabase
          .from('admin_invites')
          .update({ used_by: loggedInUserId, used_at: new Date().toISOString() })
          .eq('id', dbInviteId);
      }

      toast.success('Profile completed! Welcome to SCI Archive.');
      const dest = profileForm.role === 'admin' ? '/admin' : profileForm.role === 'lecturer' ? '/lecturer' : '/student';
      navigate(dest, { replace: true });
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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

  if (user && profile) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative">
      <ParticlesBackground />

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 shadow-lg shadow-primary/30">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text">SCI Archive</h1>
          <p className="text-muted-foreground mt-2">Student Project Archive System</p>
        </div>

        {/* ── Profile completion form (shown when auth exists but no profile) ── */}
        {needsProfile ? (
          <Card variant="glass" className="animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Signed in as <strong>{loggedInEmail}</strong>. Fill in your details to continue.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCompleteProfile}>
              <CardContent className="space-y-4">
                {/* Role */}
                <div className="space-y-3">
                  <Label>I am a</Label>
                  <RadioGroup
                    value={profileForm.role}
                    onValueChange={(v: 'student' | 'lecturer' | 'admin') =>
                      setProfileForm({ ...profileForm, role: v, adminCode: '' })
                    }
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${profileForm.role === 'student' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <RadioGroupItem value="student" id="cp-student" />
                      <Label htmlFor="cp-student" className="cursor-pointer text-sm">Student</Label>
                    </div>
                    <div className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${profileForm.role === 'lecturer' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <RadioGroupItem value="lecturer" id="cp-lecturer" />
                      <Label htmlFor="cp-lecturer" className="cursor-pointer text-sm">Lecturer</Label>
                    </div>
                    <div className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${profileForm.role === 'admin' ? 'border-orange-500 bg-orange-500/10' : 'border-border hover:border-orange-500/50'}`}>
                      <RadioGroupItem value="admin" id="cp-admin" />
                      <Label htmlFor="cp-admin" className="cursor-pointer text-sm flex items-center gap-1">
                        <Shield className="w-3 h-3" />Super Admin
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cp-name">Full Name</Label>
                  <Input
                    id="cp-name"
                    placeholder="John Doe"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    required
                  />
                </div>

                {profileForm.role === 'student' ? (
                  <div className="space-y-2">
                    <Label htmlFor="cp-reg">Registration Number</Label>
                    <Input
                      id="cp-reg"
                      placeholder="ITE/D/01-06605/2023"
                      value={profileForm.registrationNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Format: COURSE/LEVEL/NUMBER/YEAR</p>
                  </div>
                ) : profileForm.role === 'lecturer' ? (
                  <div className="space-y-2">
                    <Label htmlFor="cp-staff">Staff ID</Label>
                    <Input
                      id="cp-staff"
                      placeholder="123456"
                      value={profileForm.staffId}
                      onChange={(e) => setProfileForm({ ...profileForm, staffId: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">4–10 digits only</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="cp-admin-code" className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3 text-orange-500" />
                      Super Admin Verification Code
                    </Label>
                    <Input
                      id="cp-admin-code"
                      type="password"
                      placeholder="Enter verification code"
                      value={profileForm.adminCode}
                      onChange={(e) => setProfileForm({ ...profileForm, adminCode: e.target.value })}
                      required
                    />
                    {(() => {
                      const code = profileForm.adminCode.trim().toUpperCase();
                      const isHardcoded = code === ADMIN_INVITE_CODE;
                      const isValid = isHardcoded || cpDbInviteValid === true;
                      const isInvalid = code.length >= 8 && !isHardcoded && cpDbInviteValid === false;
                      if (isValid) return (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-600 text-xs border border-orange-500/20">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          Verified — you will be registered as a Super Admin.
                        </div>
                      );
                      if (isInvalid) return (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          Invalid or expired code.
                        </div>
                      );
                      return null;
                    })()}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Complete Setup'}
                </Button>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setNeedsProfile(false);
                  }}
                >
                  Sign out and use a different account
                </button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          /* ── Normal login form ── */
          <Card variant="glass" className="animate-slide-up delay-100">
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-sign-in"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary hover:underline">
                    Register here
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Login;
