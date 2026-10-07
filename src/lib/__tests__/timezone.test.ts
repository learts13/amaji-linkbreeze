import { describe, expect, it } from "vitest";
import { saoPauloDateKey } from "@/lib/timezone";

describe("São Paulo calendar date", () => {
  it("uses Brazil's date when it differs from UTC", () => {
    expect(saoPauloDateKey(new Date("2026-10-07T02:30:00.000Z"))).toBe("2026-10-06");
  });
});
