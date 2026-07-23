import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppAccountStatus =
  | "Pending"
  | "Active"
  | "Suspended"
  | "Rejected"
  | "Unregistered";

type AppUserRecord =
  Database["public"]["Functions"]["get_my_app_user"]["Returns"][number];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  appUser: AppUserRecord | null;
  accountStatus: AppAccountStatus;
  loading: boolean;
  accountLoading: boolean;
  accountError: string | null;
  refreshAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  appUser: null,
  accountStatus: "Unregistered",
  loading: true,
  accountLoading: false,
  accountError: null,
  refreshAccount: async () => undefined,
  signOut: async () => undefined,
});

const normalizeAccountStatus = (value: unknown): AppAccountStatus => {
  if (
    value === "Pending" ||
    value === "Active" ||
    value === "Suspended" ||
    value === "Rejected"
  ) {
    return value;
  }

  return "Unregistered";
};

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const loadAccountForUser = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setAppUser(null);
      setAccountError(null);
      setAccountLoading(false);
      return;
    }

    setAccountLoading(true);
    setAccountError(null);

    const { data, error } = await supabase.rpc("get_my_app_user");

    if (error) {
      setAppUser(null);
      setAccountError(error.message);
      setAccountLoading(false);
      return;
    }

    setAppUser(data?.[0] ?? null);
    setAccountLoading(false);
  }, []);

  const refreshAccount = useCallback(async () => {
    await loadAccountForUser(user);
  }, [loadAccountForUser, user]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const initialUser = initialSession?.user ?? null;
      setSession(initialSession);
      setUser(initialUser);
      setLoading(false);

      await loadAccountForUser(initialUser);
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;

      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);

      window.setTimeout(() => {
        void loadAccountForUser(nextUser);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAccountForUser]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setAppUser(null);
    setAccountError(null);
  }, []);

  const accountStatus = normalizeAccountStatus(appUser?.account_status);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      appUser,
      accountStatus,
      loading,
      accountLoading,
      accountError,
      refreshAccount,
      signOut,
    }),
    [
      user,
      session,
      appUser,
      accountStatus,
      loading,
      accountLoading,
      accountError,
      refreshAccount,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}