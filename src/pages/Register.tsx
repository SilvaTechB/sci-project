import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ParticlesBackground from '@/components/ParticlesBackground';
import { GraduationCap, Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertCircle, Shield, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { validateRegistrationNumber, validateStaffId, getYearSuffix } from '@/lib/regNoValidation';

const ADMIN_INVITE_CODE = 'SCIARCHIVE-ADMIN-2026';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'lecturer' | 'admin',
    registrationNumber: '',
    staffId: '',
    adminCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regNoValidation, setRegNoValidation] = useState<{
    isValid: boolean;
    yearOfStudy: number | null;
    courseName: string | null;
    canSubmit: boolean;
    levelOfStudy: string | null;
    error?: string;
  } | null>(null);
  const [staffIdValidation, setStaffIdValidation] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);
  const [dbInviteValid, setDbInviteValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (formData.role === 'student' && formData.registrationNumber) {
      const validation = validateRegistrationNumber(formData.registrationNumber);
      setRegNoValidation(validation);
    } else {
      setRegNoValidation(null);
    }
  }, [formData.registrationNumber, formData.role]);

  useEffect(() => {
    if (formData.role === 'lecturer' && formData.staffId) {
      const validation = validateStaffId(formData.staffId);
      setStaffIdValidation(validation);
    } else {
      setStaffIdValidation(null);
    }
  }, [formData.staffId, formData.role]);

  // Check DB invite codes for admin role
  useEffect(() => {
    const code = formData.adminCode.trim().toUpperCase();
    if (formData.role !== 'admin' || !code || code === ADMIN_INVITE_CODE) {
      setDbInviteValid(null);
      return;
    }
    if (code.length < 8) { setDbInviteValid(null); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('admin_invites')
        .select('id')
        .eq('code', code)
        .eq('is_active', true)
        .is('used_by', null)
        .maybeSingle();
      setDbInviteValid(!!data);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.adminCode, formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (formData.role === 'student' && !regNoValidation?.isValid) return true;
    if (formData.role === 'lecturer' && !staffIdValidation?.isValid) return true;
    if (formData.role === 'admin' && formData.adminCode.trim().length < 8) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.role === 'student' && !regNoValidation?.isValid) {
      toast.error(regNoValidation?.error || 'Invalid registration number');
      return;
    }
    if (formData.role === 'lecturer' && !staffIdValidation?.isValid) {
      toast.error(staffIdValidation?.error || 'Invalid staff ID');
      return;
    }
    if (formData.role === 'admin') {
      const code = formData.adminCode.trim().toUpperCase();
      if (code !== ADMIN_INVITE_CODE) {
        // Check database for a valid invite
        const { data: dbInvite } = await supabase
          .from('admin_invites')
          .select('id, code')
          .eq('code', code)
          .eq('is_active', true)
          .is('used_by', null)
          .maybeSingle();
        if (!dbInvite) {
          toast.error('Invalid or expired Super Admin verification code');
          return;
        }
      }
    }

    setLoading(true);
    const code = formData.adminCode.trim().toUpperCase();
    let dbInviteId: string | null = null;
    if (formData.role === 'admin' && code !== ADMIN_INVITE_CODE) {
      const { data } = await supabase
        .from('admin_invites')
        .select('id')
        .eq('code', code)
        .eq('is_active', true)
        .is('used_by', null)
        .maybeSingle();
      dbInviteId = data?.id || null;
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already been registered')
        ) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else {
          toast.error(authError.message);
        }
        return;
      }
      if (!authData.user) {
        toast.error('Sign-up failed. Please try again.');
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        if (
          signInError.message.toLowerCase().includes('not confirmed') ||
          signInError.message.toLowerCase().includes('email not confirmed')
        ) {
          toast.success('Account created! Check your email for a confirmation link, then sign in.', {
            duration: 8000,
          });
          navigate('/login');
          return;
        }
        toast.error('Account created but sign-in failed: ' + signInError.message);
        navigate('/login');
        return;
      }

      const profileData = {
        user_id: signInData.user!.id,
        full_name: formData.fullName,
        email: formData.email,
        role: formData.role,
        registration_number:
          formData.role === 'student'
            ? formData.registrationNumber.toUpperCase()
            : formData.role === 'lecturer'
            ? formData.staffId
            : null,
        course_name: formData.role === 'student' ? regNoValidation?.courseName : null,
        year_of_study: formData.role === 'student' ? regNoValidation?.yearOfStudy : null,
        can_submit: formData.role === 'student' ? (regNoValidation?.canSubmit ?? false) : false,
      };

      const { error: profileError } = await supabase.from('profiles').insert(profileData);

      if (profileError) {
        if (profileError.code === '23505') {
          toast.success('Account created successfully!');
        } else {
          toast.error('Account created but profile setup failed: ' + profileError.message);
          navigate('/login');
          return;
        }
      } else {
        toast.success('Account created successfully! Welcome to SCI Archive.');
      }

      // Mark DB invite code as used
      if (dbInviteId && signInData?.user) {
        await supabase
          .from('admin_invites')
          .update({ used_by: signInData.user.id, used_at: new Date().toISOString() })
          .eq('id', dbInviteId);
      }

      const dest =
        formData.role === 'admin' ? '/admin' : formData.role === 'lecturer' ? '/lecturer' : '/student';
      navigate(dest, { replace: true });
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative">
      <ParticlesBackground />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 shadow-lg shadow-primary/30">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text">SCI Archive</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <Card variant="glass" className="animate-slide-up delay-100">
          <CardHeader className="text-center pb-4">
            <CardTitle>Register</CardTitle>
            <CardDescription>Join the SCI Project Archive</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value: 'student' | 'lecturer' | 'admin') =>
                    setFormData({ ...formData, role: value })
                  }
                  className="grid grid-cols-3 gap-3"
                >
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${
                      formData.role === 'student'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="student" id="student" data-testid="role-student" />
                    <Label htmlFor="student" className="cursor-pointer text-sm">
                      Student
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${
                      formData.role === 'lecturer'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="lecturer" id="lecturer" data-testid="role-lecturer" />
                    <Label htmlFor="lecturer" className="cursor-pointer text-sm">
                      Lecturer
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${
                      formData.role === 'admin'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-border hover:border-orange-500/50'
                    }`}
                  >
                    <RadioGroupItem value="admin" id="admin" data-testid="role-admin" />
                    <Label htmlFor="admin" className="cursor-pointer text-sm flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Super Admin
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  data-testid="input-fullname"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  data-testid="input-email"
                />
              </div>

              {/* Registration Number — students only */}
              {formData.role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    name="registrationNumber"
                    type="text"
                    placeholder="ITE/D/01-06605/2023"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    required
                    data-testid="input-regno"
                    className={
                      regNoValidation && !regNoValidation.isValid
                        ? 'border-destructive'
                        : regNoValidation?.isValid
                        ? 'border-success'
                        : ''
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: COURSE/LEVEL/NUMBER/YEAR (e.g., ITE/D/01-06605/2023)
                  </p>
                  {regNoValidation && (
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        regNoValidation.isValid
                          ? regNoValidation.canSubmit
                            ? 'bg-success/10 text-success border border-success/20'
                            : 'bg-warning/10 text-warning border border-warning/20'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {regNoValidation.isValid ? (
                          regNoValidation.canSubmit ? (
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          )
                        ) : (
                          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <div>
                          {regNoValidation.isValid ? (
                            <>
                              <p className="font-medium">
                                {getYearSuffix(regNoValidation.yearOfStudy!)} Year •{' '}
                                {regNoValidation.courseName}
                              </p>
                              {regNoValidation.canSubmit ? (
                                <p className="text-xs opacity-80 mt-1">You can submit projects</p>
                              ) : (
                                <p className="text-xs mt-1">{regNoValidation.error}</p>
                              )}
                            </>
                          ) : (
                            <p>{regNoValidation.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Staff ID — lecturers only */}
              {formData.role === 'lecturer' && (
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    name="staffId"
                    type="text"
                    placeholder="123456"
                    value={formData.staffId}
                    onChange={handleChange}
                    required
                    data-testid="input-staffid"
                    className={
                      staffIdValidation && !staffIdValidation.isValid
                        ? 'border-destructive'
                        : staffIdValidation?.isValid
                        ? 'border-success'
                        : ''
                    }
                  />
                  <p className="text-xs text-muted-foreground">Staff ID must be 4–10 digits only</p>
                  {staffIdValidation && !staffIdValidation.isValid && (
                    <div className="p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{staffIdValidation.error}</p>
                      </div>
                    </div>
                  )}
                  {staffIdValidation?.isValid && (
                    <div className="p-3 rounded-lg text-sm bg-success/10 text-success border border-success/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>Valid Staff ID</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Code — admin only */}
              {formData.role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="adminCode" className="flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-orange-500" />
                    Super Admin Verification Code
                  </Label>
                  <Input
                    id="adminCode"
                    name="adminCode"
                    type="password"
                    placeholder="Enter invite code"
                    value={formData.adminCode}
                    onChange={handleChange}
                    required
                    data-testid="input-admincode"
                    className={
                      formData.adminCode
                        ? formData.adminCode === ADMIN_INVITE_CODE
                          ? 'border-success'
                          : 'border-destructive'
                        : ''
                    }
                  />
                  {(() => {
                    const code = formData.adminCode.trim().toUpperCase();
                    const isHardcoded = code === ADMIN_INVITE_CODE;
                    const isValid = isHardcoded || dbInviteValid === true;
                    const isInvalid = code.length >= 8 && !isHardcoded && dbInviteValid === false;
                    if (isValid) return (
                      <div className="p-3 rounded-lg text-sm bg-orange-500/10 text-orange-600 border border-orange-500/20">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <p>Verified — you will be registered as a Super Admin.</p>
                        </div>
                      </div>
                    );
                    if (isInvalid) return (
                      <div className="p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <p>Invalid or expired code. Contact the Super Admin for a new invite.</p>
                        </div>
                      </div>
                    );
                    return null;
                  })()}
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isSubmitDisabled()}
                data-testid="button-register"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
