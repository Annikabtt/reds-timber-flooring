import { FormEvent, useState } from "react";
import { ArrowLeft, KeyRound, Mail, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizeEmail(email),
        { redirectTo: `${window.location.origin}/reset-password` },
      );

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      toast({
        title: "Unable to send reset email",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

      <button
        type="button"
        onClick={() => navigate("/auth")}
        className="absolute left-5 top-5 z-20 flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </button>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.10] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A96E]/40 bg-[#5C4033]/35">
            {submitted ? (
              <Mail className="h-7 w-7 text-[#E0BC7A]" />
            ) : (
              <KeyRound className="h-7 w-7 text-[#E0BC7A]" />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {submitted ? "Check your email" : "Forgot your password?"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/70">
            {submitted
              ? "If an account exists for this email, we have sent a secure password reset link. Please also check your spam or junk folder."
              : "Enter the email used for your REDS account and we will send instructions to create a new password."}
          </p>
        </div>

        {submitted ? (
          <div className="mt-7 space-y-3">
            <Button
              type="button"
              onClick={() => navigate("/auth")}
              className="h-12 w-full bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
            >
              Return to Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="h-11 w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-white">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 border-white/20 bg-[#F7F9FB] text-slate-900"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
            >
              {submitting ? "Sending..." : "Send password reset link"}
            </Button>
          </form>
        )}

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
            <Shield className="h-3.5 w-3.5" />
            For your security, reset links expire after a limited time
          </div>
        </div>
      </div>
    </div>
  );
}
