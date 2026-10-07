import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  demoBlock: vi.fn((): string | null => null),
  getSession: vi.fn(async (): Promise<{ userId: number; username: string; exp: number; pv: number } | null> => ({ userId: 1, username: "admin", exp: Date.now() + 60000, pv: 1 })),
  revalidatePath: vi.fn(),
  createPage: vi.fn(async () => ({ id: 5 })),
  updateSetting: vi.fn(async () => undefined),
  getSetting: vi.fn(async () => null),
  getPageById: vi.fn(async (): Promise<{ id: number; slug: string } | null> => ({ id: 1, slug: "home" })),
  updatePage: vi.fn(async () => undefined),
  deletePage: vi.fn(async () => undefined),
  getDefaultPage: vi.fn(async () => ({ id: 1, slug: "home" })),
  getAllPages: vi.fn(async (): Promise<{ id: number; slug: string }[]> => []),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/demo", () => ({ demoBlock: mocks.demoBlock }));
vi.mock("@/server/queries", () => ({
  createPage: mocks.createPage,
  updatePage: mocks.updatePage,
  updateSetting: mocks.updateSetting,
  getSetting: mocks.getSetting,
  getPageById: mocks.getPageById,
  deletePage: mocks.deletePage,
  getDefaultPage: mocks.getDefaultPage,
  getAllPages: mocks.getAllPages,
}));

import { createPageAction, updatePageAction, setPageThemeAction, deletePageAction } from "@/server/actions/pages";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.demoBlock.mockReturnValue(null);
  mocks.getSession.mockResolvedValue({ userId: 1, username: "admin", exp: Date.now() + 60000, pv: 1 });
});

describe("createPageAction", () => {
  it("creates a valid page", async () => {
    const res = await createPageAction(fd({ slug: "my-page", title: "My Page", bio: "" }));
    expect(res.success).toBe(true);
    if (res.success) expect(res.pageId).toBe(5);
  });

  it("rejects when unauthenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await createPageAction(fd({ slug: "test" }));
    expect(res.success).toBe(false);
  });

  it("rejects invalid slug (spaces)", async () => {
    const res = await createPageAction(fd({ slug: "has spaces" }));
    expect(res.success).toBe(false);
  });

  it("rejects invalid slug (special chars)", async () => {
    const res = await createPageAction(fd({ slug: "test@#$" }));
    expect(res.success).toBe(false);
  });

  it("rejects duplicate slug", async () => {
    mocks.getAllPages.mockResolvedValue([{ id: 1, slug: "exists" }]);
    const res = await createPageAction(fd({ slug: "exists" }));
    expect(res.success).toBe(false);
  });
});

describe("updatePageAction", () => {
  it("updates a page", async () => {
    const res = await updatePageAction(fd({ pageId: "1", title: "Updated" }));
    expect(res.success).toBe(true);
  });

  it("passes isDefault=true through to the query layer", async () => {
    const res = await updatePageAction(fd({ pageId: "3", isDefault: "true" }));
    expect(res.success).toBe(true);
    expect(mocks.updatePage).toHaveBeenCalledWith(3, expect.objectContaining({ isDefault: true }));
  });

  it("rejects when unauthenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await updatePageAction(fd({ pageId: "1" }));
    expect(res.success).toBe(false);
  });
});

describe("page consent updates", () => {
  it("saves each page under a separate key and invalidates its public URL", async () => {
    mocks.getPageById.mockResolvedValueOnce({ id: 1, slug: "ifiscal" });
    mocks.getPageById.mockResolvedValueOnce({ id: 2, slug: "lotto-labs" });
    await updatePageAction(fd({ pageId: "1", consentText: "Fiscal consent" }));
    await updatePageAction(fd({ pageId: "2", consentText: "Lotto consent" }));
    expect(mocks.updateSetting.mock.calls).toEqual([
      ["page:1:consentText", "Fiscal consent"],
      ["page:2:consentText", "Lotto consent"],
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/lotto-labs");
  });

  it("stores an empty override instead of restoring legacy text", async () => {
    await updatePageAction(fd({ pageId: "1", consentText: "" }));
    expect(mocks.updateSetting).toHaveBeenCalledWith("page:1:consentText", "");
  });

  it("leaves consent alone when another tab is saved", async () => {
    await updatePageAction(fd({ pageId: "1", title: "New title" }));
    expect(mocks.updateSetting).not.toHaveBeenCalled();
  });

  it("rejects oversized consent before writing page data", async () => {
    const result = await updatePageAction(fd({ pageId: "1", consentText: "x".repeat(501) }));
    expect(result.success).toBe(false);
    expect(mocks.updatePage).not.toHaveBeenCalled();
    expect(mocks.updateSetting).not.toHaveBeenCalled();
  });

  it("rejects consent updates for a nonexistent page", async () => {
    mocks.getPageById.mockResolvedValueOnce(null);
    const result = await updatePageAction(fd({ pageId: "9", consentText: "test" }));
    expect(result.success).toBe(false);
    expect(mocks.updateSetting).not.toHaveBeenCalled();
  });
});

describe("setPageThemeAction", () => {
  it("sets theme for a page", async () => {
    const res = await setPageThemeAction(1, 3);
    expect(res.success).toBe(true);
  });

  it("rejects when unauthenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await setPageThemeAction(1, 3);
    expect(res.success).toBe(false);
  });
});

describe("deletePageAction", () => {
  it("deletes a non-default page (keep mode)", async () => {
    const res = await deletePageAction(fd({ pageId: "7", mode: "keep" }));
    expect(res.success).toBe(true);
    expect(mocks.deletePage).toHaveBeenCalledWith(7, false);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("deletes a non-default page (wipe mode)", async () => {
    const res = await deletePageAction(fd({ pageId: "7", mode: "wipe" }));
    expect(res.success).toBe(true);
    expect(mocks.deletePage).toHaveBeenCalledWith(7, true);
  });

  it("rejects when unauthenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await deletePageAction(fd({ pageId: "7", mode: "keep" }));
    expect(res.success).toBe(false);
    expect(mocks.deletePage).not.toHaveBeenCalled();
  });

  it("refuses to delete the default page", async () => {
    // Default page id is 1 per the getDefaultPage mock.
    const res = await deletePageAction(fd({ pageId: "1", mode: "keep" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe("The default page cannot be deleted");
    expect(mocks.deletePage).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric page id", async () => {
    const res = await deletePageAction(fd({ pageId: "abc", mode: "keep" }));
    expect(res.success).toBe(false);
    expect(mocks.deletePage).not.toHaveBeenCalled();
  });

  it("rejects an invalid delete mode", async () => {
    const res = await deletePageAction(fd({ pageId: "7", mode: "teleport" }));
    expect(res.success).toBe(false);
    expect(mocks.deletePage).not.toHaveBeenCalled();
  });

  it("returns an error when the query layer throws", async () => {
    mocks.deletePage.mockRejectedValueOnce(new Error("boom"));
    const res = await deletePageAction(fd({ pageId: "7", mode: "keep" }));
    expect(res.success).toBe(false);
  });
});
