import { useState } from "react";
import { TechLayout } from "@/components/technician/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ImagePlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function TechReport() {
  const [photos, setPhotos] = useState<string[]>([]);

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newPhotos = Array.from(files).map((f) => URL.createObjectURL(f));
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
    };
    input.click();
  };

  const handleSignOff = () => {
    toast.success("Daily sign-off completed! Great work today.");
  };

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <TechLayout>
      <h1 className="text-xl font-bold text-[hsl(20,20%,15%)] mb-1">Daily Progress</h1>
      <p className="text-sm text-[hsl(20,10%,45%)] mb-5">{today}</p>

      {/* Upload Section */}
      <Card className="border-0 shadow-md mb-4">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-[hsl(20,20%,15%)] uppercase tracking-wide mb-3">
            Progress Photos
          </h2>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {photos.map((src, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[hsl(30,15%,94%)]">
                <img src={src} alt={`Progress ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {/* Add Photo Button */}
            <button
              onClick={handleUpload}
              className="aspect-square rounded-lg border-2 border-dashed border-[hsl(30,15%,88%)] bg-[hsl(30,20%,97%)] flex flex-col items-center justify-center gap-1 text-[hsl(20,10%,45%)] active:bg-[hsl(30,15%,94%)] transition-colors"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-[10px] font-medium">Add</span>
            </button>
          </div>

          {/* Quick Capture */}
          <Button
            onClick={handleUpload}
            variant="outline"
            className="w-full h-12 gap-2 text-base border-[hsl(30,15%,88%)]"
          >
            <Camera className="h-5 w-5" />
            Take Photo
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-[hsl(20,20%,15%)] uppercase tracking-wide mb-3">
            Today's Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[hsl(30,20%,97%)] p-3 text-center">
              <p className="text-2xl font-bold text-[hsl(20,100%,41%)]">{photos.length}</p>
              <p className="text-xs text-[hsl(20,10%,45%)]">Photos Uploaded</p>
            </div>
            <div className="rounded-xl bg-[hsl(30,20%,97%)] p-3 text-center">
              <p className="text-2xl font-bold text-[hsl(20,20%,15%)]">75%</p>
              <p className="text-xs text-[hsl(20,10%,45%)]">Area Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Sign-off */}
      <Button
        onClick={handleSignOff}
        className="w-full h-14 text-lg font-bold rounded-xl bg-[hsl(142,55%,40%)] hover:bg-[hsl(142,55%,35%)] text-white shadow-lg gap-2 active:scale-[0.97] transition-all"
      >
        <CheckCircle2 className="h-6 w-6" />
        Daily Sign-off
      </Button>
    </TechLayout>
  );
}
