export const SUBSCRIBER_TIME_ZONE = "America/Sao_Paulo";

/** SQLite datetime('now') values are UTC but have no timezone suffix. */
function parseTimestamp(value: string): Date | null {
  const normalized = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatSubscriberDate(value: string, locale: string): string {
  const date = parseTimestamp(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: SUBSCRIBER_TIME_ZONE,
  }).format(date);
}

/** CSV timestamps use Brazilian local time so spreadsheet users see the signup time they expect. */
export function formatSubscriberCsvTimestamp(value: string | null): string {
  if (!value) return "";
  const date = parseTimestamp(value);
  if (!date) return value;

  const parts = new Intl.DateTimeFormat("pt-BR-u-nu-latn", {
    timeZone: SUBSCRIBER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")}:${part("second")}`;
}

export function saoPauloCalendarDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA-u-nu-latn", {
    timeZone: SUBSCRIBER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
