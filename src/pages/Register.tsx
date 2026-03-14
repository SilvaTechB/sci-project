import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ParticlesBackground from '@/components/ParticlesBackground';
import { GraduationCap, Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validateRegistrationNumber, validateStaffId, getYearSuffix } from '@/lib/regNoValidation';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'lecturer',
    registrationNumber: '',
    staffId: '',
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

  // Real-time registration number validation
  useEffect(() => {
    if (formData.role === 'student' && formData.registrationNumber) {
      const validation = validateRegistrationNumber(formData.registrationNumber);
      setRegNoValidation(validation);
    } else {
      setRegNoValidation(null);
    }
  }, [formData.registrationNumber, formData.role]);

  // Real-time staff ID validation
  useEffect(() => {
    if (formData.role === 'lecturer' && formData.staffId) {
      const validation = validateStaffId(formData.staffId);
      setStaffIdValidation(validation);
    } else {
      setStaffIdValidation(null);
    }
  }, [formData.staffId, formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    // Validate registration number for students
    if (formData.role === 'student') {
      if (!regNoValidation?.isValid) {
        toast.error(regNoValidation?.error || 'Invalid registration number');
        return;
      }
    }

    // Validate staff ID for lecturers
    if (formData.role === 'lecturer') {
      if (!staffIdValidation?.isValid) {
        toast.error(staffIdValidation?.error || 'Invalid staff ID');
        return;
      }
    }

    setLoading(true);

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (authData.user) {
        // Create profile
        const profileData = {
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          role: formData.role,
          registration_number: formData.role === 'student' 
            ? formData.registrationNumber.toUpperCase() 
            : formData.staffId,
          course_name: formData.role === 'student' ? regNoValidation?.courseName : null,
          year_of_study: formData.role === 'student' ? regNoValidation?.yearOfStudy : null,
          can_submit: formData.role === 'student' ? regNoValidation?.canSubmit : false,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          toast.error('Failed to create profile: ' + profileError.message);
          return;
        }

        toast.success('Account created successfully!');
        
        if (formData.role === 'lecturer') {
          navigate('/lecturer');
        } else {
          navigate('/student');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative">
      <ParticlesBackground />
      
      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Logo */}
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
                  onValueChange={(value: 'student' | 'lecturer') => 
                    setFormData({ ...formData, role: value })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className={`flex items-center space-x-2 p-4 rounded-lg border transition-all cursor-pointer ${formData.role === 'student' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="cursor-pointer">Student</Label>
                  </div>
                  <div className={`flex items-center space-x-2 p-4 rounded-lg border transition-all cursor-pointer ${formData.role === 'lecturer' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="lecturer" id="lecturer" />
                    <Label htmlFor="lecturer" className="cursor-pointer">Lecturer</Label>
                  </div>
                </RadioGroup>
              </div>

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
                />
              </div>

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
                />
              </div>

              {/* Registration Number - Only for students */}
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
                    className={regNoValidation && !regNoValidation.isValid ? 'border-destructive' : regNoValidation?.isValid ? 'border-success' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: COURSE/LEVEL/NUMBER/YEAR (e.g., ITE/D/01-06605/2023)
                  </p>
                  
                  {/* Validation Feedback */}
                  {regNoValidation && (
                    <div className={`p-3 rounded-lg text-sm ${
                      regNoValidation.isValid 
                        ? regNoValidation.canSubmit 
                          ? 'bg-success/10 text-success border border-success/20'
                          : 'bg-warning/10 text-warning border border-warning/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
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
                                {getYearSuffix(regNoValidation.yearOfStudy!)} Year • {regNoValidation.courseName}
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

              {/* Staff ID - Only for lecturers */}
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
                    className={staffIdValidation && !staffIdValidation.isValid ? 'border-destructive' : staffIdValidation?.isValid ? 'border-success' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Staff ID must be 4-10 digits only
                  </p>
                  
                  {/* Staff ID Validation Feedback */}
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
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                variant="gradient" 
                size="lg" 
                className="w-full"
                disabled={loading || (formData.role === 'student' && !regNoValidation?.isValid) || (formData.role === 'lecturer' && !staffIdValidation?.isValid)}
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
