
import Link from "next/link";
import { HeartHandshake, User } from "lucide-react";

const LOGO_URL =
  "https://images.fillout.com/orgid-737092/flowpublicid-uti4bix9xv/widgetid-default/uLyhUKhp6oTaSjVFoLd2M8/LOGO.png";

export const BRIDGE_URL = "https://bridge.omelora.org";

const navItems = [
  { label: "Activities", href: "/", key: "activities" },
  { label: "Projects", href: "/projects", key: "projects" },
  { label: "Partners", href: "/partners", key: "partners" },
  { label: "About", href: "/about", key: "about" },
] as const;

type Page = (typeof navItems)[number]["key"];

export function BecomeaVolunteerButton() {
  return (
    <Link
      href={BRIDGE_URL}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:px-4"
    >
      <HeartHandshake className="h-4 w-4" />
      <span className="hidden sm:inline">Become a Volunteer</span>
      <span className="sm:hidden">Join Us</span>
    </Link>
  );
}

export function SignInToBridgeButton() {
  return (
    <Link
      href={BRIDGE_URL}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:px-4"
    >
      <User className="h-4 w-4" />
      <span className="hidden sm:inline">Sign in to Bridge</span>
      <span className="sr-only sm:hidden">Sign in to Bridge</span>
    </Link>
  );
}

export function PageHeader({
  active = "activities",
}: {
  active?: Page;
}) {
  return (
    <header className="w-full bg-white">
      {/* Cream cover banner */}
      <div className="bg-[#FFF6EB] h-24">
      </div>

      {/* Integrated brand and navigation */}
      <div className="border-b border-border">
        <div className="page-container flex flex-wrap items-center justify-between gap-x-6">
          {/* Overlapping logo and organization name */}
          <Link
            href="/"
            className="relative -mt-7 flex shrink-0 items-center gap-3 py-3 sm:-mt-9"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt=""
              className="h-16 w-16 rounded-xl object-cover  sm:h-16 sm:w-16"
            />

            <div className="mt-6">
              <p className="text-xl font-bold tracking-tight text-foreground">
                Omelora
              </p>
              <p className="text-xs text-muted-foreground">
                Volunteer Resources
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            aria-label="Browse Omelora"
            className="order-3 flex w-full items-center gap-5 overflow-x-auto border-t border-border lg:order-2 lg:w-auto lg:flex-1 lg:justify-center lg:gap-7 lg:border-0"
          >
            {navItems.map(({ label, href, key }) => (
              <Link
                key={key}
                href={href}
                aria-current={active === key ? "page" : undefined}
                className={`inline-flex min-h-12 shrink-0 items-center border-b-2 text-sm font-medium transition-colors ${
                  active === key
                    ? "border-orange-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="order-2 ml-auto flex items-center gap-2 py-3 lg:order-3">
            <BecomeaVolunteerButton />
            <SignInToBridgeButton />
          </div>
        </div>
      </div>
    </header>
  );
}
