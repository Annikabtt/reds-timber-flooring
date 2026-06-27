import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type PendingPhoto = {
    id: string;
    file: File;
    previewUrl: string;
    caption: string;
    takenAt: number;
    status: "pending" | "uploading" | "uploaded" | "failed";
    error?: string;
};

type MobilePhotoUploadProps = {
    pendingPhotos: PendingPhoto[];
    setPendingPhotos: (photos: PendingPhoto[]) => void;
};

export const MobilePhotoUpload = ({
    pendingPhotos,
    setPendingPhotos,
}: MobilePhotoUploadProps) => {

    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<PendingPhoto[]>([]);
    const [inputKey, setInputKey] = useState(0);
    const [photoCaption, setPhotoCaption] = useState("");

    const getPhotoAgeLabel = (lastModified: number) => {
        const ageDays = Math.floor(
            (Date.now() - lastModified) / (24 * 60 * 60 * 1000)
        );

        if (ageDays <= 0) {
            return {
                label: "Today",
                className: "bg-green-100 text-green-700 border-green-200",
            };
        }

        if (ageDays === 1) {
            return {
                label: "Yesterday",
                className: "bg-blue-100 text-blue-700 border-blue-200",
            };
        }

        if (ageDays <= 7) {
            return {
                label: `${ageDays} days ago`,
                className: "bg-amber-100 text-amber-700 border-amber-200",
            };
        }

        return {
            label: "Older than 7 days",
            className: "bg-red-100 text-red-700 border-red-200",
        };
    };

    const addPendingFiles = () => {
        if (pendingFiles.length === 0) return;

        const newPhotos = pendingFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            caption: photoCaption.trim(),
            takenAt: file.lastModified,
            status: "pending" as const,
        }));

        const updatedPhotos = [...selectedPhotos, ...newPhotos];

        setSelectedPhotos(updatedPhotos);
        setPendingPhotos(updatedPhotos);
        setPendingFiles([]);
        setPhotoCaption("");
        setInputKey((prev) => prev + 1);
    };

    const updatePhotoCaption = (index: number, value: string) => {
        const updatedPhotos = selectedPhotos.map((photo, photoIndex) =>
            photoIndex === index ? { ...photo, caption: value } : photo
        );

        setSelectedPhotos(updatedPhotos);
        setPendingPhotos(updatedPhotos);
    };

    const removePhoto = (index: number) => {
        const updatedPhotos = selectedPhotos.filter(
            (_, photoIndex) => photoIndex !== index
        );

        setSelectedPhotos(updatedPhotos);
        setPendingPhotos(updatedPhotos);
    };


    return (
        <div className="space-y-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
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

            <div className="space-y-2">
                <Label>Caption for selected files</Label>
                <Input
                    className="h-11 rounded-xl bg-white text-base md:text-sm"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Optional caption for selected photos"
                />
            </div>

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
                    Selected Photos: {selectedPhotos.length}
                </p>

                {selectedPhotos.length === 0 ? (
                    <div className="rounded-lg bg-white px-3 py-2 text-sm text-slate-500">
                        No photos selected
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {selectedPhotos.map(({ file, caption, takenAt, previewUrl }, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="rounded-xl bg-white p-3"
                            >
                                <img
                                    src={previewUrl}
                                    alt={file.name}
                                    className="h-36 w-full rounded-lg object-cover"
                                />

                                <span
                                    className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPhotoAgeLabel(takenAt).className
                                        }`}
                                >
                                    {getPhotoAgeLabel(takenAt).label}
                                </span>

                                <div className="mt-3 space-y-2">
                                    <Label>Photo Caption</Label>
                                    <Input
                                        className="h-11 rounded-xl text-base md:text-sm"
                                        value={caption}
                                        onChange={(e) => updatePhotoCaption(index, e.target.value)}
                                        placeholder="Caption for this photo"
                                    />
                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                    Taken/File time:{" "}
                                    {new Date(takenAt).toLocaleString("en-AU", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    })}
                                </p>

                                {Date.now() - takenAt > 7 * 24 * 60 * 60 * 1000 && (
                                    <p className="text-xs font-semibold text-amber-700">
                                        Warning: this photo may be older than 7 days.
                                    </p>
                                )}

                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-slate-600">
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};