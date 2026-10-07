import { describe, expect, it } from "vitest";
import {
  formatSubscriberCsvTimestamp,
  formatSubscriberDate,
  saoPauloCalendarDate,
} from "@/lib/subscriber-dates";

describe("subscriber timestamps", () => {
  it("treats SQLite timestamps as UTC and displays the Sao Paulo calendar date", () => {
    expect(formatSubscriberDate("2026-10-07 01:30:00", "pt-BR")).toBe("6 de out. de 2026");
  });

  it("exports signup and consent timestamps in Brazilian local time", () => {
    expect(formatSubscriberCsvTimestamp("2026-10-07 01:30:00")).toBe("06/10/2026 22:30:00");
    expect(formatSubscriberCsvTimestamp("2026-10-07T01:30:00.000Z")).toBe("06/10/2026 22:30:00");
    expect(formatSubscriberCsvTimestamp(null)).toBe("");
  });

  it("uses the Sao Paulo date for the CSV filename", () => {
    expect(saoPauloCalendarDate(new Date("2026-10-07T01:30:00.000Z"))).toBe("2026-10-06");
  });
});
