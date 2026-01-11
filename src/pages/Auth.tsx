import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  Cpu, 
  Layers, 
  Lock, 
  Mail, 
  User, 
  Sparkles,
  CheckCircle2,
  Activity,
  Database,
  GitBranch,
  Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid credentials. Please check your email and password.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back to ML Platform");
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created successfully! Welcome aboard.");
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-xl bg-primary/10 animate-pulse" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">Initializing Platform...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Activity, title: "Real-Time Monitoring", desc: "Live metrics" },
    { icon: Database, title: "Data Lineage", desc: "Full visibility" },
    { icon: GitBranch, title: "Version Control", desc: "Reproducibility" },
    { icon: Shield, title: "Enterprise Security", desc: "SOC2 & GDPR" },
  ];

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Theme Toggle - Floating */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center glow-gold">
                  <Cpu className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-lg -z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ML Platform</h1>
                <p className="text-xs text-muted-foreground">Enterprise MLOps Suite</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="max-w-lg space-y-3">
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
                The Complete Platform for 
                <span className="text-gradient-gold"> Machine Learning</span> Operations
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accelerate your AI initiatives with enterprise-grade infrastructure.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 my-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-3 rounded-lg bg-card/60 backdrop-blur border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs">{feature.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>SOC2 Certified</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span>GDPR Compliant</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>99.99% SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">ML Platform</h1>
              <p className="text-[10px] text-muted-foreground">Enterprise MLOps Suite</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin 
                ? "Sign in to access your MLOps workspace" 
                : "Start with enterprise-grade ML infrastructure"
              }
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-3">
            {/* Full Name (Signup only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-9 h-10 bg-card border-border/50 focus:border-primary/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-9 h-10 bg-card border-border/50 focus:border-primary/50 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                {isLogin && (
                  <button 
                    type="button" 
                    className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-9 pr-9 h-10 bg-card border-border/50 focus:border-primary/50 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm gap-2 glow-gold transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{isLogin ? "Signing in..." : "Creating..."}</span>
                </div>
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* SSO Options */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="h-9 bg-card hover:bg-accent border-border/50 hover:border-primary/30 transition-all text-xs"
              disabled
            >
              <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              className="h-9 bg-card hover:bg-accent border-border/50 hover:border-primary/30 transition-all text-xs"
              disabled
            >
              <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </Button>
          </div>

          {/* Toggle Auth Mode */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-3 text-center text-[10px] text-muted-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;