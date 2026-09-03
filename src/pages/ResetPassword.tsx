import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Password is too short",
        description: "Please use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setCompleted(true);
      await supabase.auth.signOut();
    } catch (error) {
      toast({
        title: "Unable to update password",
        description:
          error instanceof Error
            ? error.message
            : "The reset link may have expired. Please request a new one.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const unavailable = !loading && !session && !completed;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&h=1080&fit=crop&q=60"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1A1A]/75 backdrop-blur-xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.10] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A96E]/40 bg-[#5C4033]/35">
            <KeyRound className="h-7 w-7 text-[#E0BC7A]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {completed ? "Password updated" : "Create a new password"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {completed
              ? "Your new password is ready. You can now sign in to the REDS portal."
              : unavailable
                ? "This password reset link is invalid or has expired. Please request a new link."
                : "Choose a password containing at least 8 characters."}
          </p>
        </div>

        {loading ? (
          <p className="mt-7 text-center text-sm text-white/70">
            Verifying your secure link...
          </p>
        ) : completed ? (
          <Button
            type="button"
            onClick={() => navigate("/auth", { replace: true })}
            className="mt-7 h-12 w-full bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
          >
            Continue to Sign In
          </Button>
        ) : unavailable ? (
          <Button
            type="button"
            onClick={() => navigate("/forgot-password", { replace: true })}
            className="mt-7 h-12 w-full bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
          >
            Request a new reset link
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-white">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  className="h-12 border-white/20 bg-[#F7F9FB] pr-12 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-white">
                Confirm new password
              </Label>
              <Input
                id="confirm-new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                className="h-12 border-white/20 bg-[#F7F9FB] text-slate-900"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
            >
              {submitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
            <Shield className="h-3.5 w-3.5" />
            Secure REDS account recovery
          </div>
        </div>
      </div>
    </div>
  );
}
