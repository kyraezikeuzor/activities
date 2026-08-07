import Link from "next/link";
import { ExternalLink, LogIn } from "lucide-react";
import { VOLUNTEER_EMAIL } from "@/lib/format";

const LOGO_URL =
  "https://images.fillout.com/orgid-737092/flowpublicid-uti4bix9xv/widgetid-default/uLyhUKhp6oTaSjVFoLd2M8/LOGO.png";

export const BRIDGE_URL = "https://bridge.omelora.org";
export const WEBSITE_URL = "https://omelora.org";

export function SiteVisitBar() {
  return (
    <a
      href={WEBSITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 bg-muted px-4 py-1.5 text-center text-xs font-medium text-foreground transition-opacity hover:underline sm:text-sm"
    >
      Visit Omelora.org
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
    </a>
  );
}

export function SignInToBridgeButton() {
  return (
    <a
      href={BRIDGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <LogIn className="h-4 w-4" aria-hidden />
      Sign In to Bridge
    </a>
  );
}

/** Top chrome for activity detail: visit bar only (no board lockup / Sign In row). */
export function ActivityDetailHeader() {
  return (
    <header className="w-full border-b border-border bg-background">
      <SiteVisitBar />
    </header>
  );
}

export function ActivitiesHeader() {
  return (
    <header className="w-full border-b border-border">
      <SiteVisitBar />

      <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <div className="flex min-w-0 max-w-2xl items-center gap-3">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="Omelora"
              className="h-11 w-11 rounded-lg object-cover"
            />
          </Link>
          <div className="min-w-0">
            <Link
              href="/"
              className="block text-[1.2rem] font-bold leading-tight text-foreground sm:text-[1.35rem]"
            >
              Activities
            </Link>
            <p className="mt-0 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Browse volunteer activities. Questions? Email{" "}
              <a
                href={`mailto:${VOLUNTEER_EMAIL}`}
                className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
              >
                {VOLUNTEER_EMAIL}
              </a>
              .
            </p>
          </div>
        </div>

        <SignInToBridgeButton />
      </div>
    </header>
  );
}
