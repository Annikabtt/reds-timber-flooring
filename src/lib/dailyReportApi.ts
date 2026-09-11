import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const DAILY_REPORT_PHOTO_BUCKET = "daily-report-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const DAILY_REPORT_UPDATE_TIMEOUT_MS = 30_000;

async function waitForDailyReportUpdate<T>(request: PromiseLike<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              "The Daily Report save took too long. Reload the Daily Report before editing.",
            ),
          );
        }, DAILY_REPORT_UPDATE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export type DailyReportBundle = {
  report: Json;
  activities: Json[];
  workers: Json[];
  timeLogs: Json[];
};

export type DailyReportWorkflowAction =
  | "ready_for_inspection"
  | "approve"
  | "reject";

function requireDailyReportWorkflowResult(
  data: string | null,
  error: { message: string } | null,
) {
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Daily Report workflow did not return a result.");
  return data;
}

export async function createDailyReportBundleAtomic(bundle: DailyReportBundle) {
  const { data, error } = await supabase.rpc(
    "create_daily_report_bundle_atomic",
    {
      p_report: bundle.report,
      p_activities: bundle.activities,
      p_workers: bundle.workers,
      p_time_logs: bundle.timeLogs,
    },
  );

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Daily Report was saved but no report ID was returned.");
  return data;
}

export async function updateDailyReportBundleAtomic(
  reportId: string,
  expectedUpdatedAt: string,
  bundle: Omit<DailyReportBundle, "report"> & { reportChanges: Json },
) {
  const { data, error } = await waitForDailyReportUpdate(
    supabase.rpc(
      "update_daily_report_bundle_atomic",
      {
        p_report_id: reportId,
        p_expected_updated_at: expectedUpdatedAt,
        p_report_changes: bundle.reportChanges,
        p_activities: bundle.activities,
        p_workers: bundle.workers,
        p_time_logs: bundle.timeLogs,
      },
    ),
  );

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Daily Report was saved but no new version was returned.");
  return data;
}

export async function transitionDailyReportAtomic(
  reportId: string,
  expectedUpdatedAt: string,
  action: DailyReportWorkflowAction,
  rejectionReason?: string,
) {
  const { data, error } = await waitForDailyReportUpdate(
    supabase.rpc("transition_daily_report_atomic", {
      p_report_id: reportId,
      p_expected_updated_at: expectedUpdatedAt,
      p_action: action,
      p_rejection_reason: rejectionReason || null,
    }),
  );
  return requireDailyReportWorkflowResult(data, error);
}

export async function deleteDailyReportAtomic(
  reportId: string,
  expectedUpdatedAt: string,
) {
  const { data, error } = await waitForDailyReportUpdate(
    supabase.rpc("delete_daily_report_atomic", {
      p_report_id: reportId,
      p_expected_updated_at: expectedUpdatedAt,
    }),
  );
  return requireDailyReportWorkflowResult(data, error);
}

export async function reviewDailyReportPhotoAtomic(
  photoId: string,
  action: "approve" | "reject",
) {
  const { data, error } = await waitForDailyReportUpdate(
    supabase.rpc("review_daily_report_photo_atomic", {
      p_photo_id: photoId,
      p_action: action,
    }),
  );
  return requireDailyReportWorkflowResult(data, error);
}

export async function deleteDailyReportPhotoAtomic(photoId: string) {
  const { data, error } = await waitForDailyReportUpdate(
    supabase.rpc("delete_daily_report_photo_atomic", { p_photo_id: photoId }),
  );
  return requireDailyReportWorkflowResult(data, error);
}

async function createDailyReportPhotoAtomic({
  reportId,
  photoUrl,
  caption,
  takenAt,
  sortOrder,
}: {
  reportId: string;
  photoUrl: string;
  caption?: string | null;
  takenAt?: string | null;
  sortOrder?: number;
}) {
  const { data, error } = await waitForDailyReportUpdate(
    supabase.rpc("create_daily_report_photo_atomic", {
      p_report_id: reportId,
      p_photo_url: photoUrl,
      p_caption: caption || null,
      p_taken_at: takenAt || null,
      p_sort_order: sortOrder || 0,
    }),
  );
  return requireDailyReportWorkflowResult(data, error);
}

export function dailyReportPhotoPath(value: string | null | undefined) {
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");

  try {
    const url = new URL(value);
    const markers = [
      `/storage/v1/object/public/${DAILY_REPORT_PHOTO_BUCKET}/`,
      `/storage/v1/object/sign/${DAILY_REPORT_PHOTO_BUCKET}/`,
      `/storage/v1/object/${DAILY_REPORT_PHOTO_BUCKET}/`,
    ];
    const marker = markers.find((candidate) => url.pathname.includes(candidate));
    return marker
      ? decodeURIComponent(url.pathname.split(marker)[1] || "")
      : "";
  } catch {
    return "";
  }
}

export async function createDailyReportPhotoSignedUrl(
  storedValue: string | null | undefined,
) {
  const path = dailyReportPhotoPath(storedValue);
  if (!path) return "";
  const { data, error } = await supabase.storage
    .from(DAILY_REPORT_PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadDailyReportPhoto({
  reportId,
  file,
  caption,
  takenAt,
  sortOrder = 0,
}: {
  reportId: string;
  file: File;
  caption?: string | null;
  takenAt?: string | null;
  sortOrder?: number;
}) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${reportId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(DAILY_REPORT_PHOTO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  try {
    await createDailyReportPhotoAtomic({
      reportId,
      photoUrl: path,
      caption: caption?.trim() || null,
      takenAt: takenAt || new Date().toISOString(),
      sortOrder,
    });
  } catch (error) {
    const { error: cleanupError } = await supabase.storage
      .from(DAILY_REPORT_PHOTO_BUCKET)
      .remove([path]);
    const message = error instanceof Error ? error.message : "Photo metadata was not saved.";
    const suffix = cleanupError
      ? ` The uploaded file could not be cleaned up: ${cleanupError.message}`
      : "";
    throw new Error(`${message}${suffix}`);
  }

  return path;
}

export async function removeDailyReportPhotoObject(storedValue: string) {
  const path = dailyReportPhotoPath(storedValue);
  if (!path) return;
  const { error } = await supabase.storage
    .from(DAILY_REPORT_PHOTO_BUCKET)
    .remove([path]);
  if (error) throw error;
}
