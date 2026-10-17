"use client";

import { useMemo, useState } from "react";
import { Button } from "@omelora/sunrise";
import {
  Check,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { Supply } from "@/lib/airtable";
import { VOLUNTEER_EMAIL } from "@/lib/format";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function remaining(supply: Supply): number {
  return Math.max(
    0,
    supply.quantityNeeded - supply.quantityFunded - supply.quantitySourcedInKind
  );
}

function SupplyCard({
  supply,
  quantity,
  disabled,
  onChange,
}: {
  supply: Supply;
  quantity: number;
  disabled: boolean;
  onChange: (quantity: number) => void;
}) {
  const available = remaining(supply);
  const fulfilled = Math.min(
    supply.quantityNeeded,
    supply.quantityFunded + supply.quantitySourcedInKind
  );
  const percent =
    supply.quantityNeeded > 0
      ? Math.round((fulfilled / supply.quantityNeeded) * 100)
      : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-muted">
        {supply.imageUrl ? (
          // Airtable attachment hosts are dynamic, so a fixed image allowlist is not possible.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={supply.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <PackageOpen className="h-12 w-12 text-muted-foreground" aria-hidden />
        )}
        {supply.isPlaceholder ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-700 shadow-sm">
            Planning estimate
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold leading-snug text-foreground">
              {supply.name}
            </h3>
            <span className="shrink-0 font-bold text-foreground">
              {money(supply.sponsorshipPrice)}
            </span>
          </div>
          {supply.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {supply.description}
            </p>
          ) : null}
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="h-3.5 w-3.5" aria-hidden />
            {money(supply.unitCost)} item + {money(supply.deliveryCost)} delivery
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs font-medium text-muted-foreground">
            <span>{fulfilled} of {supply.quantityNeeded} funded or sourced</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full text-muted-foreground">
              {supply.quantityFunded} sponsored
            </span>
            <span className="rounded-full text-muted-foreground">
              {supply.quantitySourcedInKind} sourced
            </span>
            <span className="rounded-full text-muted-foreground">
              {supply.quantityDelivered} delivered
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm font-medium text-muted-foreground">
            {available > 0 ? `${available} still needed` : "Fully covered"}
          </span>
          <div className="flex items-center rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, quantity - 1))}
              disabled={disabled || quantity === 0}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`Remove one ${supply.name}`}
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <output
              className="min-w-8 text-center text-sm font-bold"
              aria-live="polite"
              aria-label={`${supply.name} selected quantity`}
            >
              {quantity}
            </output>
            <button
              type="button"
              onClick={() => onChange(Math.min(available, quantity + 1))}
              disabled={disabled || quantity >= available}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-sunrise-600 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              aria-label={`Add one ${supply.name}`}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProjectDonationCart({
  projectName,
  supplies,
  completed,
}: {
  projectName: string;
  supplies: Supply[];
  completed: boolean;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reviewing, setReviewing] = useState(false);

  const lines = useMemo(
    () =>
      supplies
        .map((supply) => ({ supply, quantity: quantities[supply.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [quantities, supplies]
  );
  const itemSubtotal = lines.reduce(
    (sum, line) => sum + line.supply.unitCost * line.quantity,
    0
  );
  const deliveryTotal = lines.reduce(
    (sum, line) => sum + line.supply.deliveryCost * line.quantity,
    0
  );
  const total = itemSubtotal + deliveryTotal;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const message = encodeURIComponent(
    `Hello Omelora, I would like to support “${projectName}” with:\n${lines
      .map(
        ({ supply, quantity }) =>
          `- ${quantity} × ${supply.name} (${money(supply.sponsorshipPrice * quantity)})`
      )
      .join("\n")}\n\nEstimated total including delivery: ${money(total)}`
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="grid gap-4 sm:grid-cols-2">
        {supplies.map((supply) => (
          <SupplyCard
            key={supply.id}
            supply={supply}
            quantity={quantities[supply.id] ?? 0}
            disabled={completed}
            onChange={(quantity) => {
              setReviewing(false);
              setQuantities((current) => ({ ...current, [supply.id]: quantity }));
            }}
          />
        ))}
      </div>

      <aside className="rounded-2xl border border-border bg-white p-5 lg:sticky lg:top-5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-foreground" aria-hidden />
          <h3 className="text-lg font-bold">Your donation cart</h3>
        </div>

        {lines.length > 0 ? (
          <div className="mt-4 space-y-3">
            {lines.map(({ supply, quantity }) => (
              <div key={supply.id} className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {quantity} × {supply.name}
                </span>
                <span className="font-semibold">
                  {money(supply.sponsorshipPrice * quantity)}
                </span>
              </div>
            ))}
            <div className="space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Supplies</span><span>{money(itemSubtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span><span>{money(deliveryTotal)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold">
                <span>Total</span><span>{money(total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Choose a quantity from one or more supplies to build your gift.
          </p>
        )}

        {reviewing ? (
          <div className="mt-4 rounded-xl border border-border bg-muted p-4 text-sm">
            <p className="flex items-center gap-2 font-bold text-foreground">
              <Check className="h-4 w-4" aria-hidden /> Contribution reviewed
            </p>
            <p className="mt-1.5 leading-relaxed text-foreground">
              Contact Omelora to arrange your {itemCount}-item contribution. No payment has been taken.
            </p>
            <a
              href={`mailto:${VOLUNTEER_EMAIL}?subject=${encodeURIComponent(`Supply donation for ${projectName}`)}&body=${message}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-bold text-primary-foreground transition hover:bg-sunrise-600"
            >
              Contact Omelora to complete
            </a>
          </div>
        ) : (
          <Button
            type="button"
            disabled={lines.length === 0 || completed}
            onClick={() => setReviewing(true)}
            className="mt-4 h-11 w-full rounded-full"
          >
            {completed ? "Project completed" : "Review contribution"}
          </Button>
        )}
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          Quantities are reserved only after Omelora confirms your contribution.
        </p>
      </aside>
    </div>
  );
}
