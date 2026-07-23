import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ban,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const statusContent = {
  Pending: {
    title: "Account awaiting approval",
    description:
      "Your registration has been received. A REDS administrator must approve your account and assign a role before you can access the system.",
    icon: Clock3,
  },
  Suspended: {
    title: "Account suspended",
    description:
      "Access to this REDS account has been suspended. Contact your REDS administrator for assistance.",
    icon: Ban,
  },
  Rejected: {
    title: "Registration not approved",
    description:
      "This registration was not approved. Contact your REDS administrator if you believe this requires review.",
    icon: UserX,
  },
  Unregistered: {
    title: "Application account unavailable",
    description:
      "Your authentication account exists, but its REDS application profile could not be loaded. Refresh the page or contact an administrator.",
    icon: ShieldAlert,
  },
} as const;

export default function AccountAccessPage() {
  const navigate = useNavigate();
  const {
    user,
    appUser,
    accountStatus,
    loading,
    accountLoading,
    accountError,
    refreshAccount,
    signOut,
  } = useAuth();

  useEffect(() => {
    if (!loading && !accountLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!loading && !accountLoading && accountStatus === "Active") {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, accountLoading, user, accountStatus, navigate]);

  if (loading || accountLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9A96E] border-t-transparent" />
      </div>
    );
  }

  const content =
    statusContent[
      accountStatus === "Active" ? "Unregistered" : accountStatus
    ];
  const Icon = content.icon;

  const reason =
    accountStatus === "Suspended"
      ? appUser?.suspension_reason
      : accountStatus === "Rejected"
        ? appUser?.rejection_reason
        : null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10">
          <Icon className="h-8 w-8 text-[#C9A96E]" />
        </div>

        <h1 className="text-2xl font-bold text-white">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          {content.description}
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-left">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Signed in as
          </div>
          <div className="mt-1 break-all text-sm font-medium text-white">
            {appUser?.display_name || user?.user_metadata?.display_name || user?.email}
          </div>
          <div className="mt-1 break-all text-xs text-white/45">
            {user?.email}
          </div>

          {reason && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Administrator note
              </div>
              <div className="mt-1 text-sm text-white/70">{reason}</div>
            </div>
          )}

          {accountError && (
            <div className="mt-4 border-t border-red-300/20 pt-4 text-sm text-red-200">
              {accountError}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshAccount()}
            className="h-11 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Status
          </Button>

          <Button
            type="button"
            onClick={() => void handleSignOut()}
            className="h-11 bg-[#9E4B4B] text-white hover:bg-[#873f3f]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}