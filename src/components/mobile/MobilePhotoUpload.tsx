import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const photoPreviews = useMemo(() => {
    return photoFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  }, [photoFiles]);

  const addPendingFiles = () => {
    if (pendingFiles.length === 0) return;

    setPhotoFiles([...photoFiles, ...pendingFiles]);
    setPendingFiles([]);
    setInputKey((prev) => prev + 1);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, photoIndex) => photoIndex !== index));
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="space-y-1">
        <Label>Photos</Label>
        <p className="text-xs text-slate-500">
          Add site photos, work progress, issues, or completed areas.
        </p>
      </div>

      <Input
        key={inputKey}
        className="h-12 rounded-xl bg-white text-base md:text-sm"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setPendingFiles(files);
        }}
      />

      <Button
        type="button"
        variant="outline"
        onClick={addPendingFiles}
        disabled={pendingFiles.length === 0}
        className="h-11 w-full rounded-xl font-semibold"
      >
        Add Photos
      </Button>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">
          Selected Photos: {photoFiles.length}
        </p>

        {photoFiles.length === 0 ? (
          <div className="rounded-lg bg-white px-3 py-2 text-sm text-slate-500">
            No photos selected
          </div>
        ) : (
          <div className="space-y-2">
            {photoPreviews.map(({ file, previewUrl }, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-white p-2"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePhoto(index)}
                  className="shrink-0 text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Photo Caption</Label>
        <Input
          className="h-11 rounded-xl bg-white text-base md:text-sm"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
          placeholder="Optional caption for uploaded photos"
        />
      </div>
    </div>
  );
};