import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background texture + blur overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&h=1080&fit=crop&q=60"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-xl" />
      </div>

      {/* Back to site */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to site
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] rounded-lg shadow-2xl shadow-black/40 p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#5C4033]/30 border border-[#C9A96E]/30 flex items-center justify-center mb-5">
              <Shield className="h-7 w-7 text-[#C9A96E]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Red's System Portal
            </h1>
            <p className="text-white/40 text-sm mt-2">
              Secure access for Staff, Technicians, and Clients
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 text-sm font-medium">
                Email or Username
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@redstimber.com.au"
                required
                className="h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus-visible:ring-[#C9A96E]/50 focus-visible:border-[#C9A96E]/40 rounded-md text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  minLength={6}
                  className="h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus-visible:ring-[#C9A96E]/50 focus-visible:border-[#C9A96E]/40 rounded-md text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                  className="border-white/20 data-[state=checked]:bg-[#C9A96E] data-[state=checked]:border-[#C9A96E]"
                />
                <Label htmlFor="remember" className="text-white/50 text-sm cursor-pointer">
                  Remember me
                </Label>
              </div>
              <button type="button" className="text-[#C9A96E]/80 hover:text-[#C9A96E] text-sm transition-colors">
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#d35400] hover:bg-[#e05b00] text-white font-semibold text-sm tracking-wide rounded-md transition-all duration-200 shadow-lg shadow-[#d35400]/20 hover:shadow-[#d35400]/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Security badge */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <div className="flex items-center justify-center gap-1.5 text-white/25 text-xs">
              <Shield className="h-3.5 w-3.5" />
              256-bit SSL Encrypted · Enterprise Security
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
