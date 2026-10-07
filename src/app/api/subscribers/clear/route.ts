import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { clearSubscribers, deleteSubscribers, getPageById } from "@/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = Number(new URL(request.url).searchParams.get("pageId"));
  if (!Number.isInteger(pageId) || pageId < 1 || !(await getPageById(pageId))) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const rawBody = await request.text();
  if (rawBody) {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const ids = (body as { ids?: unknown } | null)?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 ||
      ids.some((id) => !Number.isInteger(id) || Number(id) < 1)) {
      return NextResponse.json({ error: "Invalid subscriber selection" }, { status: 400 });
    }
    await deleteSubscribers([...new Set(ids as number[])], pageId);
    return NextResponse.json({ success: true, deleted: ids.length });
  }

  await clearSubscribers(pageId);
  return NextResponse.json({ success: true });
}
