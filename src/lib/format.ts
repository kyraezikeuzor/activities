export const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

export const HOURS_REQUEST_FORM_URL =
  "https://form.fillout.com/t/eL6dML97A7us";

export const VOLUNTEER_EMAIL = "volunteer@omelora.org";

export function formatDeadline(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    // Airtable dates are YYYY-MM-DD — parse as local date
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Split instructions into lines and linkify bare URLs. */
export function parseInstructionLines(instructions: string): string[] {
  return instructions
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}
