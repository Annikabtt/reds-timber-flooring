import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Shield,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "sign-in" | "register";

type LocationState = {
  from?: string;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const {
    user,
    accountStatus,
    loading: authLoading,
    accountLoading,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const returnPath =
    (location.state as LocationState | null)?.from || "/dashboard";

  useEffect(() => {
    if (!user || authLoading || accountLoading) return;

    if (accountStatus === "Active") {
      navigate(returnPath, { replace: true });
      return;
    }

    navigate("/account-access", { replace: true });
  }, [
    user,
    authLoading,
    accountLoading,
    accountStatus,
    navigate,
    returnPath,
  ]);

  if (!authLoading && user && accountStatus === "Active") {
    return <Navigate to={returnPath} replace />;
  }

  const validateRegistration = () => {
    if (displayName.trim().length < 2) {
      throw new Error("Please enter your full name.");
    }

    if (phone.trim().length < 6) {
      throw new Error("Please enter a valid phone number.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Password confirmation does not match.");
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const normalizedEmail = normalizeEmail(email);

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      void rememberMe;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";

      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      validateRegistration();

      const normalizedEmail = normalizeEmail(email);
      const normalizedName = displayName.trim();
      const normalizedPhone = phone.trim();

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            display_name: normalizedName,
            full_name: normalizedName,
            phone: normalizedPhone,
          },
        },
      });

      if (error) throw error;

      setRegistrationSubmitted(true);

      toast({
        title: "Registration submitted",
        description: data.session
          ? "Your REDS account is waiting for administrator approval."
          : "Check your email to confirm registration. Administrator approval is also required.",
      });

      if (data.session) {
        navigate("/account-access", { replace: true });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to register.";

      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeChange = (nextMode: string) => {
    setMode(nextMode as AuthMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
    setRegistrationSubmitted(false);
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
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 z-20 flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to site
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/15 bg-white/[0.10] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A96E]/40 bg-[#5C4033]/35">
              <Shield className="h-7 w-7 text-[#E0BC7A]" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              REDS System Portal
            </h1>

            <p className="mt-2 text-sm text-white/65">
              Secure access for registered REDS team members
            </p>
          </div>

          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-lg border border-white/20 bg-black/35 p-1">
              <TabsTrigger
                value="sign-in"
                className="rounded-md text-sm font-semibold !text-white opacity-100 transition-all hover:bg-white/15 hover:!text-white data-[state=active]:!bg-[#C9A96E] data-[state=active]:!text-[#1A1A1A] data-[state=active]:shadow-md"
              >
                Sign In
              </TabsTrigger>

              <TabsTrigger
                value="register"
                className="rounded-md text-sm font-semibold !text-white opacity-100 transition-all hover:bg-white/15 hover:!text-white data-[state=active]:!bg-[#C9A96E] data-[state=active]:!text-[#1A1A1A] data-[state=active]:shadow-md"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sign-in-email" className="text-white">
                    Email
                  </Label>

                  <Input
                    id="sign-in-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-12 rounded-lg border-white/20 bg-[#F7F9FB] text-slate-900 placeholder:text-slate-400 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sign-in-password" className="text-white">
                    Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="sign-in-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="h-12 rounded-lg border-white/20 bg-[#F7F9FB] pr-12 text-slate-900 placeholder:text-slate-400 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 transition-colors hover:text-black"
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(value) => setRememberMe(value === true)}
                    className="border-white/40 data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E]"
                  />

                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm text-white/80"
                  >
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-lg bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
                >
                  {submitting ? (
                    "Signing in..."
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              {registrationSubmitted ? (
                <div className="space-y-5 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-5 text-center">
                  <Shield className="mx-auto h-9 w-9 text-emerald-300" />

                  <div>
                    <h2 className="font-semibold text-white">
                      Registration received
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Confirm your email when required. Your account remains
                      unavailable until a REDS administrator approves it and
                      assigns a role.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("sign-in")}
                    className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-white">
                      Full Name
                    </Label>

                    <Input
                      id="register-name"
                      autoComplete="name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                      className="h-11 rounded-lg border-white/20 bg-[#F7F9FB] text-slate-900 placeholder:text-slate-400 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="text-white">
                      Phone
                    </Label>

                    <Input
                      id="register-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                      className="h-11 rounded-lg border-white/20 bg-[#F7F9FB] text-slate-900 placeholder:text-slate-400 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white">
                      Email
                    </Label>

                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-11 rounded-lg border-white/20 bg-[#F7F9FB] text-slate-900 placeholder:text-slate-400 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="register-password"
                        className="text-white"
                      >
                        Password
                      </Label>

                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          minLength={8}
                          required
                          className="h-11 rounded-lg border-white/20 bg-[#F7F9FB] pr-11 text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 transition-colors hover:text-black"
                          aria-label={
                            showRegisterPassword
                              ? "Hide registration password"
                              : "Show registration password"
                          }
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirm-password"
                        className="text-white"
                      >
                        Confirm
                      </Label>

                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          minLength={8}
                          required
                          className="h-11 rounded-lg border-white/20 bg-[#F7F9FB] pr-11 text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 transition-colors hover:text-black"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password confirmation"
                              : "Show password confirmation"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-lg bg-[#d35400] font-semibold text-white hover:bg-[#e05b00]"
                  >
                    {submitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register
                      </>
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-7 border-t border-white/10 pt-5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
              <Lock className="h-3.5 w-3.5" />
              Access requires administrator approval
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}