import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PermissionRouteProps = {
  children: ReactNode;
  anyOf: string[];
};

export default function PermissionRoute({
  children,
  anyOf,
}: PermissionRouteProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const permissionKey = anyOf.join("|");

  useEffect(() => {
    let mounted = true;

    const checkPermissions = async () => {
      setLoading(true);

      try {
        const results = await Promise.all(
          anyOf.map((permissionCode) =>
            supabase.rpc("has_permission", {
              p_permission_code: permissionCode,
            })
          )
        );

        if (!mounted) return;

        const hasPermission = results.some(
          ({ data, error }) => !error && data === true
        );

        setAllowed(hasPermission);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void checkPermissions();

    return () => {
      mounted = false;
    };
  }, [permissionKey]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have permission to open this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}