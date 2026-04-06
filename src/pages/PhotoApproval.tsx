import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Camera } from "lucide-react";

const photos = [
  { id: 1, project: "Smith Residence — Kitchen", tech: "Mike R.", time: "12 min ago", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop" },
  { id: 2, project: "Oak Valley Office — Lobby", tech: "James T.", time: "28 min ago", thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop" },
  { id: 3, project: "Maple Court — Hallway", tech: "Sarah L.", time: "1h ago", thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=200&fit=crop" },
  { id: 4, project: "Cedar Lane — Master Bed", tech: "Tom K.", time: "2h ago", thumbnail: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&h=200&fit=crop" },
];

export default function PhotoApproval() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Photo Approval</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Review and approve technician photo uploads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="shadow-sm overflow-hidden">
            <img src={photo.thumbnail} alt={photo.project} className="w-full h-48 object-cover" />
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-medium text-sm">{photo.project}</p>
                <p className="text-xs text-muted-foreground">{photo.tech} · {photo.time}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1 bg-success hover:bg-success/90 text-white">
                  <Check className="h-4 w-4" /> Approve for Client
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {photos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Camera className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No photos pending approval</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
