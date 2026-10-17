import Link from "next/link";
import { LogIn } from "lucide-react";
import { VOLUNTEER_EMAIL } from "@/lib/format";
import { textColor, typography } from "@/styles/typography";

const LOGO_URL =
  "https://images.fillout.com/orgid-737092/flowpublicid-uti4bix9xv/widgetid-default/uLyhUKhp6oTaSjVFoLd2M8/LOGO.png";

/** Set NEXT_PUBLIC_BRIDGE_URL=http://localhost:3000 in .env.local to test against a local Bridge. */
export const BRIDGE_URL = (process.env.NEXT_PUBLIC_BRIDGE_URL || "https://bridge.omelora.org").replace(/\/$/, "");

export function SignInToBridgeButton() {
  return (
    <a
      href={BRIDGE_URL}
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 transition-colors ${typography.button} ${typography.buttonSecondary}`}
    >
      <LogIn className="h-4 w-4" aria-hidden />
      Sign in to Bridge
    </a>
  );
}

/** Top bar of every public page: Omelora logo and product name, Bridge sign-in. */
export function SiteHeader() {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="page-container flex items-center justify-between gap-4 py-4">
        {/* Same lockup as Bridge's sidebar: logo, product name, short descriptor. */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Omelora" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <span className={`block ${typography.sectionTitle} ${textColor.primary}`}>Activities</span>
            <span className={`block ${typography.metadata} ${textColor.secondary}`}>Volunteer Board</span>
          </div>
        </Link>
        <SignInToBridgeButton />
      </div>
    </header>
  );
}

/** Bottom of every public page: the one place volunteers are told who to ask. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className={`page-container py-6 ${typography.bodySmall} text-muted-foreground`}>
        Questions about an activity? Email{" "}
        <a href={`mailto:${VOLUNTEER_EMAIL}`} className="font-medium text-foreground underline underline-offset-2">
          {VOLUNTEER_EMAIL}
        </a>
        .
      </div>
    </footer>
  );
}
