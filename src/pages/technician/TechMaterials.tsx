import { useState } from "react";
import { TechLayout } from "@/components/technician/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";

const materials = [
  "Engineered Oak",
  "Solid Blackbutt",
  "Bamboo Strand Woven",
  "Spotted Gum",
  "Tallowwood",
  "Brushbox",
];

const grades = ["Grade A", "Grade B", "Grade C", "Select Grade"];
const sizes = ["1200x190mm", "1820x190mm", "1500x130mm", "900x85mm"];
const tones = ["Natural", "Smoked", "Grey Wash", "Walnut Stain", "Honey"];

export default function TechMaterials() {
  const [material, setMaterial] = useState("");
  const [grade, setGrade] = useState("");
  const [size, setSize] = useState("");
  const [tone, setTone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [photoName, setPhotoName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !quantity) {
      toast.error("Please fill in required fields.");
      return;
    }
    toast.success("Material request submitted!");
    setMaterial("");
    setGrade("");
    setSize("");
    setTone("");
    setQuantity("");
    setPhotoName("");
  };

  const handlePhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setPhotoName(file.name);
    };
    input.click();
  };

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <TechLayout>
      <h1 className="text-xl font-bold text-[hsl(20,20%,15%)] mb-1">Request Materials</h1>
      <p className="text-sm text-[hsl(20,10%,45%)] mb-5">{today}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            {/* Material */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">
                Material / Model <span className="text-[hsl(0,72%,51%)]">*</span>
              </Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">Specification</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tone */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">Color / Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">
                Quantity <span className="text-[hsl(0,72%,51%)]">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <Label className="text-sm font-semibold text-[hsl(20,20%,15%)] mb-3 block">
              Material Receipt / Photo
            </Label>
            <button
              type="button"
              onClick={handlePhoto}
              className="w-full h-28 rounded-xl border-2 border-dashed border-[hsl(30,15%,88%)] bg-[hsl(30,20%,97%)] flex flex-col items-center justify-center gap-2 text-[hsl(20,10%,45%)] active:bg-[hsl(30,15%,94%)] transition-colors"
            >
              {photoName ? (
                <>
                  <Upload className="h-6 w-6 text-[hsl(142,55%,40%)]" />
                  <span className="text-sm font-medium truncate max-w-[80%]">{photoName}</span>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8" />
                  <span className="text-sm font-medium">Capture or Upload Photo</span>
                </>
              )}
            </button>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold rounded-xl bg-[hsl(20,100%,41%)] hover:bg-[hsl(20,100%,35%)] text-white shadow-lg active:scale-[0.97] transition-all"
        >
          Submit Request
        </Button>
      </form>
    </TechLayout>
  );
}
