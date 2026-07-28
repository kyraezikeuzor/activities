import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

const LOGO_URL =
  "https://images.fillout.com/orgid-737092/flowpublicid-uti4bix9xv/widgetid-default/uLyhUKhp6oTaSjVFoLd2M8/LOGO.png";

const BRIDGE_URL = "https://bridge.omelora.org";
const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

export function ActivitiesHeader() {
  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Omelora"
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
          />
          <span className="text-lg font-bold leading-tight tracking-normal text-foreground">
            Omelora
            <br className="hidden sm:block" /> Volunteer Activities
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={BRIDGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Sign In to Bridge
          </a>
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sunrise-600"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Sign Up
          </a>
        </div>
      </div>
    </header>
  );
}
