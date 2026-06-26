import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MobilePhotoUploadProps = {
  photoFiles: File[];
  photoCaption: string;
  setPhotoFiles: (files: File[]) => void;
  setPhotoCaption: (value: string) => void;
};

export const MobilePhotoUpload = ({
  photoFiles,
  photoCaption,
  setPhotoFiles,
  setPhotoCaption,
}: MobilePhotoUploadProps) => {
  return (
    <>
      <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="space-y-1">
          <Label>Photos</Label>
          <p className="text-xs text-slate-500">
            Upload site photos, work progress, issues, or completed areas.
          </p>
        </div>

        <Input
          className="h-12 rounded-xl bg-white text-base md:text-sm"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setPhotoFiles(files);
          }}
        />

        <div className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
          {photoFiles.length > 0
            ? `${photoFiles.length} photo(s) selected`
            : "No photos selected"}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Photo Caption</Label>
        <Input
          className="h-11 rounded-xl text-base md:text-sm"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
          placeholder="Optional caption for uploaded photos"
        />
      </div>
    </>
  );
};