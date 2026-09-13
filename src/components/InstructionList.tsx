import type { ReactNode } from "react";
import type { InstructionBlock } from "@/lib/format";

const URL_RE = /(https?:\/\/[^\s]+)/g;

function linkify(text: string): ReactNode[] {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      const href = part.replace(/[.,;:!?)]+$/, "");
      const trailing = part.slice(href.length);
      return (
        <span key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-primary underline-offset-2 hover:underline"
          >
            {href}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Bold the leading action words (first 2–3) for scannability. */
function emphasizeLead(text: string): ReactNode {
  const tokens = text.split(/(\s+)/);
  let words = 0;
  let splitAt = tokens.length;

  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].trim()) continue;
    words += 1;
    // Bold first two words; if the 2nd is a short connector, include a 3rd
    if (words === 2) {
      const second = tokens[i].toLowerCase();
      if (["up", "your", "the", "a", "an", "to", "for", "on"].includes(second)) {
        continue;
      }
      splitAt = i + 1;
      break;
    }
    if (words >= 3) {
      splitAt = i + 1;
      break;
    }
  }

  const lead = tokens.slice(0, splitAt).join("");
  const rest = tokens.slice(splitAt).join("");

  return (
    <>
      <span className="font-semibold text-foreground/80">{lead}</span>
      {rest ? linkify(rest) : null}
    </>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <span
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold tabular-nums text-foreground"
      aria-hidden
    >
      {number}
    </span>
  );
}

function SampleBlock({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
        Copy this message
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

export function InstructionList({ blocks }: { blocks: InstructionBlock[] }) {
  if (blocks.length === 0) return null;

  const stepNumbers = blocks.map(
    (_, index) =>
      blocks.slice(0, index + 1).filter((block) => block.kind !== "sample")
        .length
  );

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.kind === "sample") {
          return <SampleBlock key={`sample-${i}`} text={block.text} />;
        }

        return (
          <div
            key={`step-${i}`}
            className="flex items-start gap-3 font-normal tracking-normal text-muted-foreground"
          >
            <StepBadge number={stepNumbers[i]} />
            <span className="min-w-0 leading-relaxed">
              {emphasizeLead(block.text)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
