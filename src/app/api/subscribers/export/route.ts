import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllSubscribers, getPageById } from "@/server/queries";
import { formatSubscriberCsvTimestamp, saoPauloCalendarDate } from "@/lib/subscriber-dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSV_HEADER = ["email", "subscribed_at", "consent_at", "consent_text"];

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV export of all subscriber emails. Auth-required. */
export async function GET(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pageId = Number(url.searchParams.get("pageId"));
  if (!Number.isInteger(pageId) || pageId < 1 || !(await getPageById(pageId))) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const rows = await getAllSubscribers(pageId);
  const lines = rows.map((r) =>
    [r.email, formatSubscriberCsvTimestamp(r.createdAt), formatSubscriberCsvTimestamp(r.consentAt), r.consentText ?? ""]
      .map(csvCell)
      .join(","),
  );

  const csv = [CSV_HEADER.join(","), ...lines].join("\n");
  const today = saoPauloCalendarDate(new Date());

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkbreeze-subscribers-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
