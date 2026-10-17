/** Brand-adjacent avatar tones (white initials). */
const AVATAR_TONES = [
  "bg-primary", // sunrise orange
  "bg-sunrise-600", // deeper orange
  "bg-navy-700", // navy
] as const;

/** Stable tone from seed — cycles through 2–3 brand colors, not a random palette. */
export function avatarToneClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

export const HOURS_REQUEST_FORM_URL =
  "https://form.fillout.com/t/eL6dML97A7us";

/** Work submission Fillout form (Submission-type activities). */
export const SUBMISSION_FORM_URL =
  "https://form.fillout.com/t/3E1RS4nnPtus";

export const VOLUNTEER_EMAIL = "volunteer@omelora.org";

/** Build a Fillout URL with dynamic query params (skips empty values). */
export function buildFilloutUrl(
  baseUrl: string,
  params: Record<string, string | null | undefined>
): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    const trimmed = value?.trim();
    if (trimmed) url.searchParams.set(key, trimmed);
  }
  return url.toString();
}

/** Short deadline for list rows: "Dec 12", plus the year when it isn't this year. */
export function formatShortDeadline(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(y !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

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

export type InstructionBlock =
  | { kind: "step"; text: string }
  | { kind: "sample"; text: string };

const QUOTED_LINE_RE = /^[“"]([\s\S]*)[”"]$/;

function stripBullet(line: string): string {
  return line.replace(/^[-•*]\s*/, "").trim();
}

function unwrapQuotes(text: string): string {
  const m = text.match(QUOTED_LINE_RE);
  return m ? m[1].trim() : text;
}

/**
 * Split instructions into steps + sample/copy-paste blocks.
 * Quoted lines (straight or curly) become `sample` blocks.
 */
export function parseInstructionBlocks(
  instructions: string
): InstructionBlock[] {
  const blocks: InstructionBlock[] = [];

  for (const raw of instructions.split(/\r?\n/)) {
    const line = stripBullet(raw);
    if (!line) continue;

    if (QUOTED_LINE_RE.test(line)) {
      blocks.push({ kind: "sample", text: unwrapQuotes(line) });
    } else {
      // Drop trailing "alongside this sample text:" cue — the quoted
      // block that follows is rendered separately.
      const cleaned = line
        .replace(/\s*alongside this sample text:\s*$/i, "")
        .trim();
      if (cleaned) blocks.push({ kind: "step", text: cleaned });
    }
  }

  return blocks;
}

/** @deprecated Prefer parseInstructionBlocks */
export function parseInstructionLines(instructions: string): string[] {
  return parseInstructionBlocks(instructions)
    .filter((b): b is Extract<InstructionBlock, { kind: "step" }> => b.kind === "step")
    .map((b) => b.text);
}
