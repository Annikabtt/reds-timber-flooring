import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

export default function Team() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["team-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground mt-1">Your workspace members</p>
      </div>

      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="border-border/50 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(profile.display_name || profile.email || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{profile.display_name || "Unnamed"}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No team members yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
