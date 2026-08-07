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

function SampleBlock({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Copy this message
      </p>
      <p className="mt-2 font-mono text-[13px] leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

export function InstructionList({ blocks }: { blocks: InstructionBlock[] }) {
  if (blocks.length === 0) return null;

  let stepNumber = 0;

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        if (block.kind === "sample") {
          return <SampleBlock key={`sample-${i}`} text={block.text} />;
        }

        stepNumber += 1;
        return (
          <div
            key={`step-${i}`}
            className="flex items-start gap-2 font-normal tracking-normal text-muted-foreground"
          >
            <span className="w-4 shrink-0 text-center leading-normal tabular-nums">
              {stepNumber}.
            </span>
            <span className="min-w-0 leading-normal">{linkify(block.text)}</span>
          </div>
        );
      })}
    </div>
  );
}
