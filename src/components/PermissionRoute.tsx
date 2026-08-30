import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type PermissionRouteProps = {
  children: ReactNode;
  anyOf: string[];
};

export default function PermissionRoute({
  children,
  anyOf,
}: PermissionRouteProps) {
  const navigate = useNavigate();
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
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold">
            This page is not available for your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your account is working normally. Access to this page is limited
            by your assigned permissions. Please choose an available menu or
            return to your home page.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
            <Button onClick={() => navigate("/my-work", { replace: true })}>
              Go to My Work
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}