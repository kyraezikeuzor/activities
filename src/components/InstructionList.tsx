import type { ReactNode } from "react";

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

export function InstructionList({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0 select-none text-muted-foreground">-</span>
          <span>{linkify(line)}</span>
        </li>
      ))}
    </ul>
  );
}
