/** Calendar date key for today in São Paulo. */
export function saoPauloDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA-u-nu-latn", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
