import "server-only";
import { getSetting } from "@/server/queries";

/** Each page has its own override; an empty override uses the form default. */
export function pageConsentKey(pageId: number): string {
  return `page:${pageId}:consentText`;
}

export async function getPageConsentText(pageId: number): Promise<string | null> {
  const text = await getSetting(pageConsentKey(pageId));
  // Keep existing installations' text until each page is saved individually.
  // Do not use ||: an explicitly cleared override must not inherit legacy text.
  return text !== null ? text : getSetting("consentText");
}
