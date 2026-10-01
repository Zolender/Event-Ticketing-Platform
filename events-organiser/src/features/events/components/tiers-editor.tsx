"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Collapse } from "@/components/ui/collapse";
import {
  AddIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DeleteIcon,
} from "@/components/ui/icons";
import { TextField } from "@/components/ui/text-field";
import { MAX_TIERS } from "../event-schema";
import { newTierKey, type TierDraft } from "../form-state";
import { currencyDigits, parseCapacity } from "../money";

type TierField = "name" | "price" | "capacity";

type TiersEditorProps = {
  tiers: TierDraft[];
  currency: string;
  /** Always an update of the current list, so edits made during an animation are never lost. */
  onChange: (update: (current: TierDraft[]) => TierDraft[]) => void;
  /** The message to show now for a tier's field, if any. */
  errorFor: (tier: TierDraft, field: TierField) => string | undefined;
  onLeave: (tier: TierDraft, field: TierField) => void;
};

const iconButton =
  "grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-38";

/**
 * The ticket tiers, in the order buyers will see them. Added rows open smoothly, reordered rows
 * slide to their new place, and a removed row leaves the form's data at once while a copy of it
 * folds away on screen (all instant with reduced motion).
 */
export function TiersEditor({
  tiers,
  currency,
  onChange,
  errorFor,
  onLeave,
}: TiersEditorProps) {
  const [ghosts, setGhosts] = useState<{ tier: TierDraft; index: number }[]>(
    [],
  );
  const [added, setAdded] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const before = useRef<Map<string, number> | null>(null);
  const focusAfter = useRef<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const rows = [...tiers];
  for (const ghost of ghosts)
    rows.splice(Math.min(ghost.index, rows.length), 0, ghost.tier);
  const total = tiers.reduce((sum, tier) => {
    const capacity = parseCapacity(tier.capacity);
    return capacity.ok ? sum + capacity.value : sum;
  }, 0);

  // FLIP: rows measured before a move slide from where they were to where they are.
  useLayoutEffect(() => {
    const tops = before.current;
    before.current = null;
    if (
      tops &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      for (const [key, row] of rowRefs.current) {
        const was = tops.get(key);
        if (was === undefined) continue;
        const shift = was - row.getBoundingClientRect().top;
        if (shift)
          row.animate(
            [{ transform: `translateY(${shift}px)` }, { transform: "none" }],
            {
              duration: 250,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
            },
          );
      }
    }
    if (focusAfter.current) {
      document
        .getElementById(focusAfter.current)
        ?.focus({ preventScroll: true });
      focusAfter.current = null;
    }
  });

  function measure() {
    before.current = new Map(
      [...rowRefs.current].map(([key, row]) => [
        key,
        row.getBoundingClientRect().top,
      ]),
    );
  }

  function update(key: string, field: TierField, value: string) {
    onChange((current) =>
      current.map((tier) =>
        tier.key === key ? { ...tier, [field]: value } : tier,
      ),
    );
  }

  function move(key: string, by: -1 | 1) {
    measure();
    // Focus stays on the button pressed, unless the move disabled it (first or last place).
    const target = tiers.findIndex((tier) => tier.key === key) + by;
    const edge = by < 0 ? target === 0 : target === tiers.length - 1;
    focusAfter.current = `${key}-${by < 0 !== edge ? "up" : "down"}`;
    onChange((current) => {
      const index = current.findIndex((tier) => tier.key === key);
      const order = [...current];
      [order[index], order[index + by]] = [order[index + by], order[index]];
      return order;
    });
  }

  function add() {
    const key = newTierKey();
    setAdded(key);
    focusAfter.current = `${key}-name`;
    onChange((current) => [
      ...current,
      { key, name: "", price: "", capacity: "" },
    ]);
  }

  function remove(tier: TierDraft, index: number) {
    const next = tiers[index + 1] ?? tiers[index - 1];
    focusAfter.current = next ? `${next.key}-name` : null;
    if (!next) addRef.current?.focus({ preventScroll: true });
    setGhosts((current) => [...current, { tier, index }]);
    onChange((current) => current.filter((other) => other.key !== tier.key));
  }

  return (
    <div className="flex flex-col gap-3">
      {tiers.length === 0 && ghosts.length === 0 && (
        <p className="text-body-md text-on-surface-variant">
          A draft can have no tiers yet. At least one is needed before
          publishing.
        </p>
      )}
      <ol aria-label="Ticket tiers" className="flex flex-col">
        {rows.map((tier) => {
          const index = tiers.indexOf(tier);
          const ghost = index < 0;
          const name = tier.name.trim() || `tier ${index + 1}`;
          return (
            <li
              key={tier.key}
              ref={(row) => {
                if (row) rowRefs.current.set(tier.key, row);
                else rowRefs.current.delete(tier.key);
              }}
            >
              <Collapse
                open={!ghost}
                appear={tier.key === added}
                onExited={() => {
                  measure();
                  setGhosts((current) =>
                    current.filter((g) => g.tier.key !== tier.key),
                  );
                }}
              >
                <div
                  inert={ghost}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-3 border-b border-outline-variant py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
                >
                  <TextField
                    id={`${tier.key}-name`}
                    label="Tier name"
                    value={tier.name}
                    maxLength={120}
                    error={errorFor(tier, "name")}
                    onChange={(event) =>
                      update(tier.key, "name", event.target.value)
                    }
                    onBlur={() => onLeave(tier, "name")}
                  />
                  <div className="row-span-1 flex items-center sm:order-last sm:h-14">
                    <button
                      id={`${tier.key}-up`}
                      type="button"
                      aria-label={`Move ${name} up`}
                      disabled={index <= 0}
                      onClick={() => move(tier.key, -1)}
                      className={iconButton}
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      id={`${tier.key}-down`}
                      type="button"
                      aria-label={`Move ${name} down`}
                      disabled={ghost || index === tiers.length - 1}
                      onClick={() => move(tier.key, 1)}
                      className={iconButton}
                    >
                      <ArrowDownIcon />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => remove(tier, index)}
                      className={iconButton}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-2 sm:contents">
                    <TextField
                      id={`${tier.key}-price`}
                      label={`Price (${currency})`}
                      value={tier.price}
                      inputMode={
                        currencyDigits(currency) ? "decimal" : "numeric"
                      }
                      autoComplete="off"
                      error={errorFor(tier, "price")}
                      onChange={(event) =>
                        update(tier.key, "price", event.target.value)
                      }
                      onBlur={() => onLeave(tier, "price")}
                    />
                    <TextField
                      id={`${tier.key}-capacity`}
                      label="Capacity"
                      value={tier.capacity}
                      inputMode="numeric"
                      autoComplete="off"
                      error={errorFor(tier, "capacity")}
                      onChange={(event) =>
                        update(tier.key, "capacity", event.target.value)
                      }
                      onBlur={() => onLeave(tier, "capacity")}
                    />
                  </div>
                </div>
              </Collapse>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          ref={addRef}
          type="button"
          onClick={add}
          disabled={tiers.length >= MAX_TIERS}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-outline pr-6 pl-4 text-label-lg text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-38"
        >
          <AddIcon className="size-5" />
          Add a tier
        </button>
        {tiers.length >= MAX_TIERS ? (
          <p className="text-body-md text-on-surface-variant">
            At most {MAX_TIERS} tiers.
          </p>
        ) : (
          tiers.length > 0 && (
            <p className="text-body-md text-on-surface-variant">
              Total capacity{" "}
              <span className="text-title-sm text-on-surface tabular-nums">
                {total.toLocaleString("en-GB")}
              </span>
            </p>
          )
        )}
      </div>
    </div>
  );
}
