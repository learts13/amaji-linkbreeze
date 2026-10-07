import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { clearSubscribers, getPageById } from "@/server/queries";

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

  await clearSubscribers(pageId);
  return NextResponse.json({ success: true });
}
