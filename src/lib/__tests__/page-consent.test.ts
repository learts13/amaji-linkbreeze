import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ getSetting: vi.fn() }));
vi.mock("@/server/queries", () => ({ getSetting: mocks.getSetting }));
import { getPageConsentText } from "@/lib/page-consent";
beforeEach(() => vi.resetAllMocks());

describe("page consent", () => {
  it("keeps two pages independent", async () => {
    const settings = new Map([
      ["consentText", "Legacy"],
      ["page:1:consentText", "Fiscal"],
      ["page:2:consentText", "Lotto"],
    ]);
    mocks.getSetting.mockImplementation(async (key) => settings.get(key) ?? null);
    expect(await getPageConsentText(1)).toBe("Fiscal");
    expect(await getPageConsentText(2)).toBe("Lotto");
    settings.set("page:2:consentText", "Changed Lotto");
    expect(await getPageConsentText(1)).toBe("Fiscal");
    expect(await getPageConsentText(2)).toBe("Changed Lotto");
  });

  it("preserves legacy text until the page is saved", async () => {
    mocks.getSetting.mockResolvedValueOnce(null).mockResolvedValueOnce("Legacy");
    expect(await getPageConsentText(1)).toBe("Legacy");
  });

  it("does not fall back to legacy text after explicitly clearing a page", async () => {
    mocks.getSetting.mockResolvedValueOnce("");
    expect(await getPageConsentText(1)).toBe("");
    expect(mocks.getSetting).toHaveBeenCalledTimes(1);
  });
});
