import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Camera } from "lucide-react";

const photos: {
  id: number;
  project: string;
  tech: string;
  time: string;
  thumbnail: string;
}[] = [];

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
