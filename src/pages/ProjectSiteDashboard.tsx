import { ArrowLeft, Building2, ClipboardList, MapPin, Package, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectSiteDashboard() {
  const { siteId } = useParams();

  const { data: site, isLoading } = useQuery({
    queryKey: ["project-site-dashboard", siteId],
    enabled: Boolean(siteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          project_id,
          site_code,
          site_name,
          address_line_1,
          address_line_2,
          suburb,
          state,
          postcode,
          country,
          contact_name,
          contact_phone,
          notes,
          is_active,
          projects (
            project_no,
            project_name,
            customers (
              customer_name
            )
          )
        `)
        .eq("site_id", siteId)
        .eq("is_deleted", false)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const address = [
    site?.address_line_1,
    site?.address_line_2,
    site?.suburb,
    site?.state,
    site?.postcode,
    site?.country,
  ]
    .filter(Boolean)
    .join(", ");

  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading site dashboard...</div>;
  }

  if (!site) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-slate-600">Project site not found.</p>
        <Button asChild variant="outline">
          <Link to="/project-sites">Back to Project Sites</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="outline" className="mb-4">
            <Link to="/project-sites">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project Sites
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {site.site_name}
              </h1>
              <p className="text-slate-500">
                {site.site_code || "No site code"}
              </p>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            site.is_active
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {site.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">0</p>
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">0</p>
              <ClipboardList className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Material Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">0</p>
              <Package className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">0</p>
              <Truck className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Address</p>
              <p className="font-medium text-slate-900">{address || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Contact</p>
              <p className="font-medium text-slate-900">
                {site.contact_name || "-"}
              </p>
              <p className="text-slate-600">{site.contact_phone || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Notes</p>
              <p className="text-slate-700 whitespace-pre-wrap">
                {site.notes || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Project</p>
              <p className="font-medium text-slate-900">
                {site.projects?.project_name || "-"}
              </p>
              <p className="text-slate-600">
                {site.projects?.project_no || "-"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Customer</p>
              <p className="font-medium text-slate-900">
                {site.projects?.customers?.customer_name || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}