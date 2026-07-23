// deno-lint-ignore no-import-prefix
import { createClient } from "npm:@supabase/supabase-js@2";

type NotificationEvent = {
  notification_event_id: string;
  event_code: string;
  event_key: string;
  source_table: string;
  source_id: string;
  severity: "Info" | "Warning" | "Critical";
  payload: Record<string, unknown> | null;
  attempt_count: number;
};

type TelegramRecipient = {
  auth_user_id: string;
  display_name: string;
  email: string;
  role_codes: string[];
  notification_destination_id: string;
  destination_name: string;
  telegram_chat_id: string;
  permission_source: string;
};

type DeliveryAttemptRow = {
  notification_destination_id: string;
  delivery_status: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CRON_SECRET = Deno.env.get("TELEGRAM_CRON_SECRET");

function resolveSecretKey(): string | null {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const rawSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!rawSecretKeys) return null;

  try {
    const parsed = JSON.parse(rawSecretKeys) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

const SUPABASE_SECRET_KEY = resolveSecretKey();

if (
  !SUPABASE_URL ||
  !SUPABASE_SECRET_KEY ||
  !TELEGRAM_BOT_TOKEN ||
  !TELEGRAM_CRON_SECRET
) {
  throw new Error(
    "Missing SUPABASE_URL, Supabase server secret key, TELEGRAM_BOT_TOKEN, or TELEGRAM_CRON_SECRET.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return escapeHtml(value);
}

function asUuidOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(trimmed)
    ? trimmed
    : null;
}

function buildDailyReportMessage(event: NotificationEvent): string {
  const p = event.payload ?? {};

  return [
    "📝 <b>Daily Report Submitted</b>",
    "",
    `<b>Report date:</b> ${display(p.report_date)}`,
    `<b>Project:</b> <code>${display(p.project_id)}</code>`,
    `<b>Site:</b> <code>${display(p.site_id)}</code>`,
    `<b>Area:</b> <code>${display(p.area_id)}</code>`,
    `<b>Work Order:</b> <code>${display(p.work_order_id)}</code>`,
    `<b>Progress:</b> ${display(p.progress_percent)}%`,
    `<b>Completed quantity:</b> ${display(p.completed_quantity)}`,
    `<b>Workers:</b> ${display(p.workers_count)}`,
    `<b>Weather:</b> ${display(p.weather_condition)}`,
    "",
    `<b>Work completed:</b> ${display(p.work_completed)}`,
    `<b>Issues:</b> ${display(p.issues_found)}`,
    `<b>Next actions:</b> ${display(p.next_actions)}`,
    `<b>Notes:</b> ${display(p.notes)}`,
  ].join("\n");
}

function buildReceivingMessage(event: NotificationEvent): string {
  const p = event.payload ?? {};

  const heading =
    event.event_code === "site_goods_receiving_issue"
      ? "🚨 <b>Site Goods Receiving Issue</b>"
      : event.event_code === "site_goods_receiving_partial"
      ? "⚠️ <b>Site Goods Receiving Partial</b>"
      : "📦 <b>Site Goods Receiving Completed</b>";

  return [
    heading,
    "",
    `<b>Delivery status:</b> ${display(p.delivery_status)}`,
    `<b>Receipt:</b> <code>${display(p.supplier_delivery_receipt_id)}</code>`,
    `<b>Supplier delivery:</b> <code>${display(p.supplier_delivery_id)}</code>`,
    `<b>Project:</b> <code>${display(p.project_id)}</code>`,
    `<b>Site:</b> <code>${display(p.site_id)}</code>`,
    `<b>Stock location:</b> <code>${display(p.stock_location_id)}</code>`,
    `<b>Received by:</b> <code>${display(p.received_by_employee_id)}</code>`,
    `<b>Processed items:</b> ${display(p.processed_item_count)}`,
    `<b>Replacement items:</b> ${display(p.replacement_claim_item_count)}`,
    `<b>Payment hold:</b> ${
      p.payment_hold_required === true ? "Yes" : "No"
    }`,
    `<b>Purchase order:</b> ${display(p.purchase_order_status)}`,
    `<b>Notes:</b> ${display(p.notes)}`,
  ].join("\n");
}

function buildMessage(event: NotificationEvent): string {
  if (event.event_code === "daily_report_submitted") {
    return buildDailyReportMessage(event);
  }

  if (
    event.event_code === "site_goods_receiving_completed" ||
    event.event_code === "site_goods_receiving_partial" ||
    event.event_code === "site_goods_receiving_issue"
  ) {
    return buildReceivingMessage(event);
  }

  return [
    "🔔 <b>REDS Notification</b>",
    "",
    `<b>Event:</b> ${display(event.event_code)}`,
    `<b>Severity:</b> ${display(event.severity)}`,
    `<b>Source:</b> ${display(event.source_table)}`,
    `<b>Source ID:</b> <code>${display(event.source_id)}</code>`,
  ].join("\n");
}

async function sendTelegram(
  chatId: string,
  text: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  const result = await response.json() as Record<string, unknown>;

  if (!response.ok || result.ok !== true) {
    const description =
      typeof result.description === "string"
        ? result.description
        : `Telegram HTTP ${response.status}`;

    throw new Error(description);
  }

  return result;
}

async function loadRecipients(
  event: NotificationEvent,
): Promise<TelegramRecipient[]> {
  const payload = event.payload ?? {};
  const projectId = asUuidOrNull(payload.project_id);
  const siteId = asUuidOrNull(payload.site_id);

  const { data, error } = await supabase.rpc(
    "resolve_telegram_notification_recipients",
    {
      p_event_code: event.event_code,
      p_project_id: projectId,
      p_site_id: siteId,
    },
  );

  if (error) throw error;

  const recipients = (data ?? []) as TelegramRecipient[];

  const uniqueByDestination = new Map<string, TelegramRecipient>();

  for (const recipient of recipients) {
    if (
      !recipient.notification_destination_id ||
      !recipient.telegram_chat_id ||
      !recipient.auth_user_id
    ) {
      continue;
    }

    uniqueByDestination.set(
      recipient.notification_destination_id,
      recipient,
    );
  }

  return [...uniqueByDestination.values()];
}

async function loadAlreadySentDestinationIds(
  notificationEventId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("notification_delivery_attempts")
    .select("notification_destination_id, delivery_status")
    .eq("notification_event_id", notificationEventId)
    .eq("delivery_status", "Sent");

  if (error) throw error;

  return new Set(
    ((data ?? []) as DeliveryAttemptRow[])
      .map((row) => row.notification_destination_id)
      .filter(Boolean),
  );
}

async function updateEventAsSentWithoutRecipients(
  event: NotificationEvent,
  attemptNo: number,
) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("notification_events")
    .update({
      event_status: "Sent",
      attempt_count: attemptNo,
      processing_started_at: null,
      sent_at: now,
      failed_at: null,
      next_attempt_at: null,
      last_error: null,
    })
    .eq("notification_event_id", event.notification_event_id);

  if (error) throw error;

  return {
    notification_event_id: event.notification_event_id,
    event_code: event.event_code,
    status: "Sent",
    sent: 0,
    failed: 0,
    skipped: true,
    reason: "No enabled Telegram recipient has effective permission.",
    errors: [],
  };
}

async function processEvent(event: NotificationEvent) {
  const attemptNo = event.attempt_count + 1;
  const recipients = await loadRecipients(event);
  const alreadySentDestinationIds = await loadAlreadySentDestinationIds(
    event.notification_event_id,
  );

  const pendingRecipients = recipients.filter(
    (recipient) =>
      !alreadySentDestinationIds.has(recipient.notification_destination_id),
  );

  if (recipients.length === 0) {
    return await updateEventAsSentWithoutRecipients(event, attemptNo);
  }

  if (pendingRecipients.length === 0) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("notification_events")
      .update({
        event_status: "Sent",
        attempt_count: attemptNo,
        processing_started_at: null,
        sent_at: now,
        failed_at: null,
        next_attempt_at: null,
        last_error: null,
      })
      .eq("notification_event_id", event.notification_event_id);

    if (error) throw error;

    return {
      notification_event_id: event.notification_event_id,
      event_code: event.event_code,
      status: "Sent",
      sent: 0,
      failed: 0,
      skipped: true,
      reason: "All eligible Telegram recipients were already sent.",
      errors: [],
    };
  }

  const message = buildMessage(event);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of pendingRecipients) {
    const { data: attempt, error: attemptError } = await supabase
      .from("notification_delivery_attempts")
      .insert({
        notification_event_id: event.notification_event_id,
        notification_destination_id:
          recipient.notification_destination_id,
        attempt_no: attemptNo,
        delivery_status: "Processing",
        request_payload: {
          auth_user_id: recipient.auth_user_id,
          chat_id: recipient.telegram_chat_id,
          event_code: event.event_code,
          permission_source: recipient.permission_source,
        },
        attempted_at: new Date().toISOString(),
      })
      .select("notification_delivery_attempt_id")
      .single();

    if (attemptError) {
      failed += 1;
      errors.push(
        `${recipient.destination_name}: ${attemptError.message}`,
      );
      continue;
    }

    try {
      const telegramResult = await sendTelegram(
        recipient.telegram_chat_id,
        message,
      );

      const telegramMessage = telegramResult.result as
        | Record<string, unknown>
        | undefined;

      const { error: sentAttemptError } = await supabase
        .from("notification_delivery_attempts")
        .update({
          delivery_status: "Sent",
          telegram_message_id: String(
            telegramMessage?.message_id ?? "",
          ),
          response_payload: telegramResult,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq(
          "notification_delivery_attempt_id",
          attempt.notification_delivery_attempt_id,
        );

      if (sentAttemptError) throw sentAttemptError;

      sent += 1;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);

      await supabase
        .from("notification_delivery_attempts")
        .update({
          delivery_status: "Failed",
          error_message: errorMessage,
        })
        .eq(
          "notification_delivery_attempt_id",
          attempt.notification_delivery_attempt_id,
        );

      failed += 1;
      errors.push(`${recipient.destination_name}: ${errorMessage}`);
    }
  }

  const now = new Date().toISOString();
  const finalStatus =
    failed === 0 ? "Sent" : sent > 0 ? "Partially Sent" : "Failed";

  const eventUpdate: Record<string, unknown> = {
    event_status: finalStatus,
    attempt_count: attemptNo,
    processing_started_at: null,
    last_error: errors.length > 0 ? errors.join(" | ") : null,
  };

  if (finalStatus === "Sent") {
    eventUpdate.sent_at = now;
    eventUpdate.failed_at = null;
    eventUpdate.next_attempt_at = null;
  } else {
    eventUpdate.failed_at = now;
    eventUpdate.next_attempt_at = new Date(
      Date.now() + 15 * 60 * 1000,
    ).toISOString();
  }

  const { error: eventUpdateError } = await supabase
    .from("notification_events")
    .update(eventUpdate)
    .eq("notification_event_id", event.notification_event_id);

  if (eventUpdateError) throw eventUpdateError;

  return {
    notification_event_id: event.notification_event_id,
    event_code: event.event_code,
    status: finalStatus,
    eligible_recipients: recipients.length,
    pending_recipients: pendingRecipients.length,
    previously_sent: alreadySentDestinationIds.size,
    sent,
    failed,
    errors,
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Use POST." }, 405);
  }

  const suppliedSecret = request.headers.get("x-cron-secret");

  if (!suppliedSecret || suppliedSecret !== TELEGRAM_CRON_SECRET) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    let requestBody: { event_id?: string; limit?: number } = {};

    try {
      requestBody = await request.json();
    } catch {
      requestBody = {};
    }

    const limit = Math.min(
      Math.max(
        Number.isFinite(requestBody.limit)
          ? Number(requestBody.limit)
          : 10,
        1,
      ),
      50,
    );

    let query = supabase
      .from("notification_events")
      .select(`
        notification_event_id,
        event_code,
        event_key,
        source_table,
        source_id,
        severity,
        payload,
        attempt_count
      `)
      .in("event_status", ["Pending", "Partially Sent", "Failed"])
      .lte("next_attempt_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);

    if (requestBody.event_id) {
      query = query.eq(
        "notification_event_id",
        requestBody.event_id,
      );
    }

    const { data: events, error: eventsError } = await query;
    if (eventsError) throw eventsError;

    const results: unknown[] = [];

    for (const event of (events ?? []) as NotificationEvent[]) {
      const { data: claimed, error: claimError } = await supabase
        .from("notification_events")
        .update({
          event_status: "Processing",
          processing_started_at: new Date().toISOString(),
        })
        .eq("notification_event_id", event.notification_event_id)
        .in("event_status", ["Pending", "Partially Sent", "Failed"])
        .select("notification_event_id");

      if (claimError) throw claimError;
      if (!claimed || claimed.length === 0) continue;

      try {
        results.push(await processEvent(event));
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);

        await supabase
          .from("notification_events")
          .update({
            event_status: "Failed",
            processing_started_at: null,
            failed_at: new Date().toISOString(),
            attempt_count: event.attempt_count + 1,
            last_error: errorMessage,
            next_attempt_at: new Date(
              Date.now() + 15 * 60 * 1000,
            ).toISOString(),
          })
          .eq("notification_event_id", event.notification_event_id);

        results.push({
          notification_event_id: event.notification_event_id,
          event_code: event.event_code,
          status: "Failed",
          error: errorMessage,
        });
      }
    }

    return jsonResponse({
      processed: results.length,
      results,
    });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);

    return jsonResponse({ error: errorMessage }, 500);
  }
});