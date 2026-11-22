import { useAtomValue } from "@effect/atom-react";
import { refreshUsageLimits } from "@t3tools/client-runtime/state/usage";
import { AuthOrchestrationReadScope } from "@t3tools/contracts";
import {
  collectLimitAccounts,
  collectLimitPools,
  displayLimitWindows,
} from "@t3tools/shared/usageLimits";
import { useGT } from "gt-react";
import { ChevronDownIcon, GaugeIcon, RefreshCwIcon } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { environmentPresentations } from "../../state/presentation";
import { serverEnvironment } from "../../state/server";
import { useEnvironmentsWithScope } from "../../state/session";
import { useAtomCommand } from "../../state/use-atom-command";
import { providerClients } from "../settings/providerDriverMeta";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { UsageLimitsPooled } from "../usage/UsageLimitsPooled";

const MAX_HEADER_POOLS = 3;

export function HeaderQuotaPopover() {
  const gt = useGT();
  const presentations = useAtomValue(environmentPresentations.presentationsWithProvidersAtom);
  const refreshProviders = useAtomCommand(serverEnvironment.refreshProviders);
  const connected = [...presentations].flatMap(([environmentId, presentation]) =>
    presentation.connection.phase === "connected" && presentation.serverConfig !== null
      ? [{ environmentId }]
      : [],
  );
  const refreshable = useEnvironmentsWithScope(connected, AuthOrchestrationReadScope);
  const [now, setNow] = useState(Date.now);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const pools = collectLimitPools(collectLimitAccounts(presentations), now);
  const metrics = pools.slice(0, MAX_HEADER_POOLS).flatMap((pool) => {
    const windows = displayLimitWindows(pool);
    const window = windows.find((candidate) => candidate.kind === "weekly") ?? windows[0];
    if (!window) return [];
    return [
      {
        driver: pool.driver,
        label: providerClients.get(pool.driver)?.label ?? String(pool.driver),
        window,
      },
    ];
  });
  const moreCount = pools.length - MAX_HEADER_POOLS;

  const refreshLimits = async (automatic: boolean) => {
    if (refreshingRef.current || refreshable.size === 0) return;
    refreshingRef.current = true;
    setRefreshing(true);
    await Promise.allSettled(
      [...refreshable].map((environmentId) =>
        refreshUsageLimits(
          environmentId,
          () => refreshProviders({ environmentId, input: {} }),
          automatic,
        ),
      ),
    );
    setNow(Date.now());
    refreshingRef.current = false;
    setRefreshing(false);
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) return;
        setNow(Date.now());
        void refreshLimits(true);
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border/70 px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-expanded:bg-accent aria-expanded:text-foreground [-webkit-app-region:no-drag]"
          />
        }
        aria-label={gt("Usage limits")}
        aria-description={
          metrics
            .map(({ label, window }) => `${label} · ${window.label} · ${window.remainingPercent}%`)
            .join("; ") || undefined
        }
      >
        <GaugeIcon aria-hidden className="size-3.5 shrink-0" />
        {metrics.length > 0 ? (
          <span aria-hidden className="hidden items-center gap-2 @min-[36rem]/chat-header:flex">
            {metrics.map(({ driver, label, window }) => (
              <span key={driver} className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-3 shrink-0 place-items-center rounded-full after:size-2 after:rounded-full after:bg-background",
                    window.remainingPercent <= 15 ? "text-warning" : "text-success",
                  )}
                  style={{
                    backgroundImage: `conic-gradient(currentColor ${window.remainingPercent}%, var(--border) 0)`,
                  }}
                />
                <span className="max-w-24 truncate">{label}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {window.remainingPercent}%
                </span>
              </span>
            ))}
            {moreCount > 0 ? <span className="tabular-nums">+{moreCount}</span> : null}
          </span>
        ) : null}
        <ChevronDownIcon aria-hidden className="size-3 shrink-0" />
      </PopoverTrigger>
      <PopoverPopup
        ref={popupRef}
        initialFocus={popupRef}
        align="end"
        sideOffset={8}
        className="max-h-(--available-height)"
      >
        <div className="w-[min(42rem,calc(100vw-4rem))]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <PopoverTitle>{gt("Usage limits")}</PopoverTitle>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost-muted"
                    size="icon-xs"
                    disabled={refreshing || refreshable.size === 0}
                  />
                }
                aria-label={gt("Refresh limits")}
                onClick={() => void refreshLimits(false)}
              >
                <RefreshCwIcon aria-hidden />
              </TooltipTrigger>
              <TooltipPopup>{gt("Refresh limits")}</TooltipPopup>
            </Tooltip>
          </div>
          <UsageLimitsPooled presentations={presentations} now={now} />
        </div>
      </PopoverPopup>
    </Popover>
  );
}
