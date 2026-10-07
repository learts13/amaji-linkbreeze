import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  addSubscriber: vi.fn(async () => undefined),
  getSetting: vi.fn(async (_key: string): Promise<string | null> => null),
  getPageById: vi.fn(async (): Promise<{ id: number; isPublished: boolean; emailCapture: boolean } | null> => ({ id: 1, isPublished: true, emailCapture: true })),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/queries", () => ({
  addSubscriber: mocks.addSubscriber,
  getSetting: mocks.getSetting,
  getPageById: mocks.getPageById,
}));

// Mock next/headers for rate-limiting
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
}));

// Mock rate-limit to always allow
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ ok: true, remaining: 9, resetAt: Date.now() + 60000 }),
}));

import { subscribe } from "@/server/actions/subscribers";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  f.set("pageId", "1");
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSetting.mockResolvedValue(null);
});

describe("subscribe", () => {
  it("accepts a valid email with consent", async () => {
    const res = await subscribe(fd({ email: "user@example.com", consent: "on" }));
    expect(res.success).toBe(true);
    expect(mocks.addSubscriber).toHaveBeenCalledWith(
      "user@example.com",
      expect.any(String),
    );
  });

  it("lowercases uppercase email (valid without whitespace)", async () => {
    await subscribe(fd({ email: "User@Example.COM", consent: "on" }));
    expect(mocks.addSubscriber).toHaveBeenCalledWith(
      "user@example.com",
      expect.any(String),
    );
  });

  it("rejects submission without consent checkbox", async () => {
    const res = await subscribe(fd({ email: "user@example.com" }));
    expect(res.success).toBe(false);
    expect(mocks.addSubscriber).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const res = await subscribe(fd({ email: "not-an-email", consent: "on" }));
    expect(res.success).toBe(false);
    expect(mocks.addSubscriber).not.toHaveBeenCalled();
  });

  it("rejects an empty email", async () => {
    const res = await subscribe(fd({ email: "", consent: "on" }));
    expect(res.success).toBe(false);
  });

  it("returns success even on duplicate (no leak)", async () => {
    mocks.addSubscriber.mockRejectedValueOnce(new Error("UNIQUE constraint"));
    const res = await subscribe(fd({ email: "dup@example.com", consent: "on" }));
    expect(res.success).toBe(true);
  });

  it("stores the consent text from the selected page", async () => {
    mocks.getSetting.mockResolvedValueOnce("Custom consent text");
    await subscribe(fd({ email: "user@example.com", consent: "on" }));
    expect(mocks.addSubscriber).toHaveBeenCalledWith(
      "user@example.com",
      "Custom consent text",
    );
    expect(mocks.getSetting).toHaveBeenCalledWith("page:1:consentText");
  });

  it("falls back to default consent text when setting is empty", async () => {
    mocks.getSetting.mockResolvedValueOnce(null);
    await subscribe(fd({ email: "user@example.com", consent: "on" }));
    expect(mocks.addSubscriber).toHaveBeenCalledWith(
      "user@example.com",
      expect.stringContaining("I agree to receive emails"),
    );
  });
});

describe("subscription page validation", () => {
  it.each(["", "0", "-1", "1.5", "invalid"])("rejects invalid page id %s", async (pageId) => {
    const result = await subscribe(fd({ email: "user@example.com", consent: "on", pageId }));
    expect(result.success).toBe(false);
    expect(mocks.addSubscriber).not.toHaveBeenCalled();
  });

  it.each([null, { id: 1, isPublished: false, emailCapture: true }, { id: 1, isPublished: true, emailCapture: false }])("rejects unavailable pages", async (page) => {
    mocks.getPageById.mockResolvedValueOnce(page);
    const result = await subscribe(fd({ email: "user@example.com", consent: "on" }));
    expect(result.success).toBe(false);
    expect(mocks.addSubscriber).not.toHaveBeenCalled();
  });

  it("uses page 2's text even when the browser sends another text", async () => {
    mocks.getPageById.mockResolvedValueOnce({ id: 2, isPublished: true, emailCapture: true });
    mocks.getSetting.mockImplementation(async (key) => key === "page:2:consentText" ? "Lotto consent" : "Fiscal consent");
    await subscribe(fd({ pageId: "2", email: "user@example.com", consent: "on", consentText: "Forged" }));
    expect(mocks.addSubscriber).toHaveBeenCalledWith("user@example.com", "Lotto consent");
  });
});
