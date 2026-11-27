import { Link } from "@tanstack/react-router";
import type {
  ModelSelection,
  ServerProvider,
  ServerProviderUsageWindow,
  UsageLimitSourceSnapshots,
} from "@t3tools/contracts";
import type { ContextWindowSnapshot } from "@t3tools/client-runtime/state/context-window";
import { collectProviderUsageLimits, remainingPercent } from "@t3tools/shared/usageLimits";
import { formatDuration, limitsNotice } from "@t3tools/shared/usageLimitsCopy";
import { ArrowRightIcon, GaugeIcon } from "lucide-react";
import { useGT, useMessages } from "gt-react";
import type { CSSProperties, ReactNode } from "react";

import { useNowMinute } from "../../hooks/useNowMinute";
import { formatContextWindowTokens } from "../../lib/contextWindow";
import { cn } from "../../lib/utils";
import { ComposerControl } from "./ComposerControl";
import { composerFloatingLayerProps } from "./composerEventScope";
import { composerQuotaPools } from "./composerQuotaPools";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../ui/popover";

export interface ComposerUsageInput {
  readonly providers: readonly ServerProvider[];
  readonly sources: UsageLimitSourceSnapshots;
  readonly contextWindow: ContextWindowSnapshot | null;
  readonly turns: number;
  readonly messages: number;
  readonly workItems: number;
}

function UsageRing({
  percent,
  className,
}: {
  percent: number | null;
  className?: string | undefined;
}) {
  return (
    <span
      aria-hidden
      className={cn("relative block shrink-0 rounded-full", className)}
      style={{ background: `conic-gradient(currentColor ${percent ?? 0}%, var(--border) 0)` }}
    >
      <span className="absolute inset-[2px] rounded-full bg-popover" />
    </span>
  );
}

function quotaTone(percent: number | null, defaultTone: string) {
  return percent === null
    ? "text-muted-foreground"
    : percent <= 10
      ? "text-error"
      : percent <= 20
        ? "text-warning"
        : defaultTone;
}

function QuotaRings({ windows }: { windows: readonly ServerProviderUsageWindow[] }) {
  const short = windows.find((window) => window.kind === "session");
  const weekly = windows.find((window) => window.kind === "weekly");
  const outer = weekly ?? short ?? windows[0];
  const inner = weekly && short ? remainingPercent(short) : null;
  const percent = outer ? remainingPercent(outer) : null;
  return (
    <span className="relative grid size-5 shrink-0 place-items-center" aria-hidden>
      <UsageRing
        percent={percent}
        className={cn("size-5", quotaTone(percent, "text-orange-600 dark:text-orange-400"))}
      />
      {inner !== null ? (
        <UsageRing
          percent={inner}
          className={cn("absolute size-2.5", quotaTone(inner, "text-success"))}
        />
      ) : null}
    </span>
  );
}

export function ComposerQuotaMeter({
  usage,
  selection,
  inDetails = false,
}: {
  usage: Pick<ComposerUsageInput, "providers" | "sources">;
  selection: ModelSelection;
  inDetails?: boolean;
}) {
  const gt = useGT();
  const m = useMessages();
  const now = Date.parse(`${useNowMinute()}:00Z`);
  const { instanceId, model } = selection;
  const selected = usage.providers.find((provider) => provider.instanceId === instanceId);
  if (!selected) return null;
  const report = collectProviderUsageLimits(instanceId, usage.providers, usage.sources, now);
  const limits =
    report?.accounts.find((account) => account.instanceId === instanceId)?.limits ??
    selected.usageLimits;
  if (!limits) return null;
  const notice = limitsNotice(limits, m);
  const pools = notice ? [] : composerQuotaPools(selected.driver, limits.windows, model);
  const current = pools.find((pool) => pool.current);
  const lowest =
    current?.windows.reduce(
      (minimum, window) => Math.min(minimum, remainingPercent(window)),
      100,
    ) ?? null;
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        aria-label={gt("Usage limits")}
        aria-description={lowest === null ? undefined : `${lowest}%`}
        render={<ComposerControl size="sm" className="shrink-0 tabular-nums" />}
      >
        {current ? (
          <QuotaRings windows={current.windows} />
        ) : (
          <GaugeIcon className="size-4" aria-hidden />
        )}
        {inDetails ? <span>{gt("Usage limits")}</span> : null}
        {lowest !== null ? (
          <span className={quotaTone(lowest, "text-foreground")}>{lowest}%</span>
        ) : null}
      </PopoverTrigger>
      <PopoverPopup
        width="md"
        side={inDetails ? "left" : "top"}
        align="start"
        {...composerFloatingLayerProps}
      >
        <div className="grid max-h-80 gap-2 overflow-y-auto">
          <PopoverTitle>{gt("Usage limits")}</PopoverTitle>
          {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
          {pools.map((pool) => (
            <div
              key={pool.key}
              className={cn("flex items-start gap-2 rounded-md p-2", pool.current && "bg-muted")}
            >
              <QuotaRings windows={pool.windows} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{pool.label ?? gt("Usage limits")}</span>
                  {pool.current ? (
                    <span className="text-xs text-primary">{gt("Current")}</span>
                  ) : null}
                </div>
                {pool.windows.map((window) => {
                  const reset = window.resetsAt ? Date.parse(window.resetsAt) : Number.NaN;
                  const percent = remainingPercent(window);
                  return (
                    <div key={window.id} className="flex justify-between gap-2 text-xs">
                      <span className={quotaTone(percent, "text-foreground")}>
                        {pool.label ? window.label.split(" · ").at(-1) : window.label} · {percent}%
                      </span>
                      {reset > now ? (
                        <span className="text-end text-muted-foreground">
                          {gt("Resets in {value0}", { value0: formatDuration(reset - now, m) })}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <Link
            to="/usage"
            className="flex items-center justify-between gap-2 border-t border-border pt-2 text-sm hover:text-primary"
          >
            {gt("View full usage")} <ArrowRightIcon aria-hidden className="size-4" />
          </Link>
        </div>
      </PopoverPopup>
    </Popover>
  );
}

function ContextRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end tabular-nums">{children}</dd>
    </>
  );
}

export function ComposerContextMeter({
  usage,
  inDetails = false,
}: {
  usage: ComposerUsageInput;
  inDetails?: boolean;
}) {
  const gt = useGT();
  const m = useMessages();
  const context = usage.contextWindow;
  if (!context) return null;
  const percent = context.usedPercentage === null ? null : Math.round(context.usedPercentage);
  const used = formatContextWindowTokens(context.usedTokens);
  const cacheHit =
    context.inputTokens && context.cachedInputTokens != null
      ? Math.min(100, (100 * context.cachedInputTokens) / context.inputTokens)
      : null;
  const threshold = context.autoCompactThreshold;
  const tick =
    context.maxTokens && threshold && threshold < context.maxTokens
      ? (threshold * 100) / context.maxTokens
      : null;
  const tokenRows = [
    { label: gt("Input tokens"), value: context.inputTokens },
    { label: gt("Output tokens"), value: context.outputTokens },
    { label: gt("Cached input"), value: context.cachedInputTokens },
    { label: gt("Reasoning tokens"), value: context.reasoningOutputTokens },
    { label: gt("Window size"), value: context.maxTokens },
    { label: gt("Remaining tokens"), value: context.remainingTokens },
    { label: gt("Total processed tokens"), value: context.totalProcessedTokens },
  ];
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        aria-label={gt("Context window")}
        aria-description={percent === null ? used : `${percent}% · ${used}`}
        render={<ComposerControl size="sm" className="shrink-0 tabular-nums" />}
      >
        {inDetails ? <span>{gt("Context")}</span> : null}
        <span className={inDetails ? undefined : "hidden @min-[26rem]/composer-footer:inline"}>
          {percent !== null ? `${percent}% · ${used}` : used}
        </span>
        <UsageRing percent={percent} className="size-4 text-foreground" />
      </PopoverTrigger>
      <PopoverPopup
        width="md"
        side={inDetails ? "left" : "top"}
        align="end"
        {...composerFloatingLayerProps}
      >
        <div className="grid gap-2">
          <PopoverTitle>{gt("Context and statistics")}</PopoverTitle>
          <div className="flex justify-between text-xs">
            <span>{gt("Context")}</span>
            <span>{percent === null ? used : `${percent}% · ${used}`}</span>
          </div>
          {percent !== null ? (
            <div className="relative h-1.5 rounded-full bg-muted-foreground/30" aria-hidden>
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              {tick !== null ? (
                <span
                  className="absolute inset-y-0 w-px bg-foreground"
                  style={{ left: `${tick}%` } satisfies CSSProperties}
                />
              ) : null}
            </div>
          ) : null}
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t border-border pt-2 text-xs">
            {cacheHit === null ? null : (
              <ContextRow label={gt("Cache hit rate")}>{cacheHit.toFixed(1)}%</ContextRow>
            )}
            <ContextRow label={gt("Turns")}>{usage.turns}</ContextRow>
            <ContextRow label={gt("Messages")}>{usage.messages}</ContextRow>
            <ContextRow label={gt("Tools and steps")}>
              {context.toolUses ?? usage.workItems}
            </ContextRow>
            {context.cost ? (
              <ContextRow label={gt("Cost")}>
                {context.cost.amount} {context.cost.currency}
              </ContextRow>
            ) : null}
          </dl>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t border-border pt-2 text-xs">
            {tokenRows.map(({ label, value }) =>
              value == null ? null : (
                <ContextRow key={label} label={label}>
                  {formatContextWindowTokens(value)}
                </ContextRow>
              ),
            )}
          </dl>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
