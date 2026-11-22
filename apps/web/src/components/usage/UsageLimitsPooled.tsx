import { useGT, T } from "gt-react";
import {
  CHATGPT_USAGE_URL,
  collectLimitAccounts,
  collectExternalUsageLinks,
  collectLimitNotices,
  collectLimitPools,
  cursorUsageWindowDetails,
  displayLimitWindows,
  formatResetsIn,
  type LimitAccount,
  type LimitPool,
  type LimitPoolMember,
  type LimitPoolWindow,
  paceRemainingPercent,
  remainingPercent,
  type ResetCreditChoice,
  resetCreditChoices,
} from "@t3tools/shared/usageLimits";
import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { normalizeProviderAccentColor } from "@t3tools/client-runtime/state/provider-instance-display";
import { AlertTriangleIcon, ClockIcon, ExternalLinkIcon, TicketIcon } from "lucide-react";
import {
  createContext,
  type ReactNode,
  type RefObject,
  use,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { ensureLocalApi } from "../../localApi";
import { usePrimarySettings } from "../../hooks/useSettings";
import { cn } from "../../lib/utils";
import { formatUpcomingTimestamp } from "../../timestampFormat";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";
import { RedactedSensitiveText } from "../settings/RedactedSensitiveText";
import { Button } from "../ui/button";
import { OpenAI } from "../Icons";
import { Alert, AlertTitle } from "../ui/alert";
import { Popover, PopoverCreateHandle, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { PaceIcon, ResetCreditDialog, barColor, usePaceMark, useResetCredit } from "./UsageLimits";

function accountInitials(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local[0] ?? ""}${domain[0] ?? ""}`.toUpperCase() || "?";
}

function accountHue(email: string): number {
  let hash = 0;
  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 360;
}

function AccountChip({ email }: { readonly email: string }) {
  const gt = useGT();
  const hue = accountHue(email);
  return (
    <span
      role="img"
      aria-label={gt("Account {value0}", { value0: accountInitials(email) })}
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-3xs leading-none font-semibold"
      style={{ backgroundColor: `oklch(0.85 0.08 ${hue})`, color: `oklch(0.35 0.1 ${hue})` }}
    >
      {accountInitials(email)}
    </span>
  );
}

function AccountAvatar({
  account,
  className,
}: {
  readonly account: LimitAccount;
  readonly className?: string;
}) {
  if (account.redeem) {
    return (
      <ProviderInstanceIcon
        driverKind={account.driver}
        displayName={
          account.displayName ??
          providerClients.get(account.driver)?.label ??
          String(account.driver)
        }
        accentColor={account.accentColor}
        showBadge={Boolean(account.displayName)}
        indicatorBackground="var(--popover)"
        className={cn("size-5", className)}
        iconClassName="size-4 text-foreground/80"
      />
    );
  }
  return account.email ? <AccountChip email={account.email} /> : null;
}

function AccountName({
  account,
  className,
}: {
  readonly account: LimitAccount;
  readonly className?: string;
}) {
  if (account.displayName) return <span className={className}>{account.displayName}</span>;
  if (account.email) {
    return (
      <span className={cn("inline-flex min-w-0 items-center", className)}>
        <AccountChip email={account.email} />
      </span>
    );
  }
  return (
    <span className={className}>
      {providerClients.get(account.driver)?.label ?? String(account.driver)}
    </span>
  );
}

function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-foreground tabular-nums">{children}</span>
    </div>
  );
}

function SegmentPopover({
  account,
  window,
  reset,
  now,
  redeem,
  onRedeem,
}: {
  readonly account: LimitAccount;
  readonly window: LimitPoolMember["window"];
  readonly reset: LimitPoolWindow["resets"][number] | undefined;
  readonly now: number;
  readonly redeem: ReturnType<typeof useResetCredit> | null;
  readonly onRedeem: (choice: ResetCreditChoice) => void;
}) {
  const gt = useGT();
  const timestampFormat = usePrimarySettings((settings) => settings.timestampFormat);
  const remaining = remainingPercent(window);
  const timeLeft = paceRemainingPercent(window, now);
  const resetsIn = formatResetsIn(window, now);
  const where =
    account.environments.length > 0
      ? account.environments.map((environment) => environment.label).join(", ")
      : account.sourceLabel;
  const choices =
    redeem && account.redeem && account.limits.resetCredits?.availableCount
      ? resetCreditChoices(account.limits.resetCredits, account.redeem.input, now, true)
      : [];
  return (
    <div className="flex w-72 max-w-[calc(100vw-3rem)] flex-col gap-2.5 text-xs">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AccountAvatar account={account} />
          <span className="truncate">
            {account.displayName ?? providerClients.get(account.driver)?.label ?? account.driver}
          </span>
        </span>
        {account.email ? (
          <RedactedSensitiveText
            value={account.email}
            ariaLabel="Toggle account email visibility"
            revealTooltip="Click to reveal email"
            hideTooltip="Click to hide email"
            className="w-fit"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1 border-t border-border/60 pt-2.5">
        {account.plan ? <Row label={gt("Plan")}>{account.plan}</Row> : null}
        {where ? (
          <Row label={account.environments.length > 0 ? gt("Signed in") : gt("Via")}>{where}</Row>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 border-t border-border/60 pt-2.5">
        <Row label={gt("Left")}>{remaining}%</Row>
        {window.resetsAt ? (
          <Row label={gt("Resets")}>
            {formatUpcomingTimestamp(window.resetsAt, timestampFormat, now)}
            {resetsIn ? ` · ${resetsIn.replace("resets in ", "in ")}` : ""}
          </Row>
        ) : null}
        {timeLeft !== null ? (
          <Row label={gt("Even pace")}>
            {timeLeft}
            <T>% left by now</T>
          </Row>
        ) : null}
        {reset && reset.restoresPercent > 0 ? (
          <Row label={gt("Restores")}>
            +{reset.restoresPercent}
            <T>% of pool</T>
          </Row>
        ) : null}
      </div>
      {choices.length > 0 && redeem ? (
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2.5 text-muted-foreground">
          {choices.map((choice) => (
            <span key={choice.key} className="flex items-center gap-3">
              <span className="tabular-nums">{choice.summary}</span>
              {choice.availableCount > 0 ? (
                <Button
                  size="xs"
                  variant="outline"
                  disabled={redeem.busy || !redeem.canManageProviders}
                  className="ms-auto"
                  onClick={() => onRedeem(choice)}
                >
                  {redeem.busy ? gt("Using…") : choice.actionLabel}
                </Button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Every segment on the page shares one popover, so hovering or clicking another
 * segment moves it instead of opening a second one. The payload is the segment
 * it currently describes.
 */
type SegmentPayload = Omit<Parameters<typeof SegmentPopover>[0], "now" | "onRedeem">;
const SegmentPopoverContext = createContext<ReturnType<
  typeof PopoverCreateHandle<SegmentPayload>
> | null>(null);

function ActiveSegmentPopover({
  handle,
  actions,
  payload,
  pools,
  now,
}: {
  readonly handle: ReturnType<typeof PopoverCreateHandle<SegmentPayload>>;
  readonly actions: RefObject<PopoverPrimitive.Root.Actions | null>;
  readonly payload: SegmentPayload;
  readonly pools: readonly LimitPool[];
  readonly now: number;
}) {
  const available = pools.some((pool) =>
    displayLimitWindows(pool).some((window) =>
      window.members.some(
        (member) =>
          member.account.key === payload.account.key &&
          member.window.id === payload.window.id &&
          member.window.kind === payload.window.kind &&
          Boolean(member.account.redeem) === Boolean(payload.redeem),
      ),
    ),
  );
  // The trigger is gone, so the popup has nothing to anchor to: an exit transition would
  // slide it to the viewport origin. Unmount it outright, which also clears Base UI's
  // active-trigger bookkeeping so the segment can open again when it comes back.
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- closes the popover handle and unmounts the Base UI popup before paint when its trigger is gone
  useLayoutEffect(() => {
    if (available) return;
    handle.close();
    actions.current?.unmount();
  }, [available, handle, actions]);
  return (
    <PopoverPopup side="top" sideOffset={6}>
      <SegmentPopover
        {...payload}
        now={now}
        onRedeem={(choice) => {
          handle.close();
          payload.redeem?.confirm(choice);
        }}
      />
    </PopoverPopup>
  );
}

/**
 * The confirm remains mounted after the account popover closes.
 */
function PoolSegment({
  account,
  ...props
}: {
  readonly account: LimitAccount;
  readonly window: LimitPoolMember["window"];
  readonly reset: LimitPoolWindow["resets"][number] | undefined;
  readonly refillPercent: number;
  readonly color: string;
  readonly now: number;
  readonly showAccountName: boolean;
}) {
  return account.redeem ? (
    <RedeemableSegment account={account} redeemAt={account.redeem} {...props} />
  ) : (
    <QuotaBarTrigger account={account} redeem={null} {...props} />
  );
}

function RedeemableSegment({
  redeemAt,
  ...props
}: Omit<Parameters<typeof QuotaBarTrigger>[0], "redeem"> & {
  readonly redeemAt: NonNullable<LimitAccount["redeem"]>;
}) {
  const gt = useGT();
  const redeem = useResetCredit(redeemAt.environmentId);
  return (
    <>
      <QuotaBarTrigger redeem={redeem} {...props} />
      <ResetCreditDialog
        open={redeem.confirming}
        onOpenChange={redeem.setConfirming}
        choice={redeem.choice}
        onConfirm={() => void redeem.redeem()}
        disabled={!redeem.canManageProviders}
      />
      {/* The popover closed before the confirm, so progress and the outcome need a home outside it. */}
      {redeem.busy || redeem.status ? (
        <span role="status" className="text-xs text-muted-foreground">
          <AccountName account={props.account} className="font-medium text-foreground" />{" "}
          {redeem.busy ? gt("Using reset credit…") : redeem.status}
        </span>
      ) : null}
    </>
  );
}

const QUOTA_CELLS_MASK =
  "repeating-linear-gradient(90deg, black 0 calc(5% - min(2px, 1%)), transparent calc(5% - min(2px, 1%)) 5%)";
const LOW_QUOTA_PERCENT = 15;

function quotaTone(remaining: number) {
  return remaining <= LOW_QUOTA_PERCENT ? "text-warning-foreground" : "text-success-foreground";
}

function useQuotaWindowLabel() {
  const gt = useGT();
  return (label: string) => {
    const names: Readonly<Record<string, string>> = {
      Session: gt("Session quota"),
      "5-hour": gt("5-hour quota"),
      Weekly: gt("Weekly quota"),
      Monthly: gt("Monthly quota"),
    };
    const separator = label.lastIndexOf(" · ");
    const name = label.slice(separator < 0 ? 0 : separator + 3);
    return Object.hasOwn(names, name)
      ? label.slice(0, label.length - name.length) + names[name]
      : label;
  };
}

function QuotaBarTrigger({
  account,
  window,
  reset,
  redeem,
  refillPercent,
  color,
  now,
  showAccountName,
}: SegmentPayload & {
  readonly refillPercent: number;
  readonly color: string;
  readonly now: number;
  readonly showAccountName: boolean;
}) {
  const gt = useGT();
  const popover = use(SegmentPopoverContext) ?? undefined;
  const timestampFormat = usePrimarySettings((settings) => settings.timestampFormat);
  const payload: SegmentPayload = { account, window, reset, redeem };
  const remaining = remainingPercent(window);
  const timeLeft = paceRemainingPercent(window, now);
  const [segmentRef, paceMark] = usePaceMark(timeLeft);
  const resetsIn = formatResetsIn(window, now);
  const resetTime = window.resetsAt
    ? formatUpcomingTimestamp(window.resetsAt, timestampFormat, now)
    : "";
  const credits = account.limits.resetCredits?.availableCount ?? 0;
  return (
    <PopoverTrigger
      handle={popover}
      payload={payload}
      openOnHover
      render={
        <button
          type="button"
          aria-label={gt("{value0}: {value1}% left{value2}{value3}{value4}", {
            value0:
              account.displayName ??
              (account.email ? accountInitials(account.email) : account.driver),
            value1: remaining,
            value2: resetsIn ? `, ${resetsIn}` : "",
            value3:
              timeLeft === null ? "" : gt(", {value0}% of the window left", { value0: timeLeft }),
            value4: credits
              ? gt(", {value0} reset {value1} banked", {
                  value0: credits,
                  value1: credits === 1 ? "credit" : "credits",
                })
              : "",
          })}
          className="flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-md py-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[popup-open]:bg-accent/50"
        />
      }
    >
      {showAccountName || resetsIn || credits > 0 ? (
        <span className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {showAccountName ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <AccountName
                account={account}
                className="min-w-0 truncate font-medium text-foreground"
              />
              <span className="shrink-0 text-muted-foreground tabular-nums">{remaining}%</span>
            </span>
          ) : null}
          <span className="ms-auto flex items-center gap-1.5 text-muted-foreground tabular-nums">
            {resetTime ? `↻ ${resetTime}` : ""}
            {credits ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-accent px-1.5 font-medium text-foreground">
                <TicketIcon className="size-3" aria-hidden />
                {credits}
              </span>
            ) : null}
          </span>
        </span>
      ) : null}
      <span ref={segmentRef} aria-hidden className="relative h-2 w-full">
        <span
          className="absolute inset-0 overflow-hidden rounded-sm"
          style={{ maskImage: QUOTA_CELLS_MASK }}
        >
          <span className="absolute inset-0 bg-muted" />
          <span className="absolute inset-0" style={paceMark?.gap}>
            <span
              className="absolute inset-y-0 left-0 opacity-75"
              style={{ width: `${remaining}%`, backgroundColor: color }}
            />
            {remaining < 100 && reset && refillPercent > 0 ? (
              <span
                className="absolute inset-y-0 right-0 opacity-15"
                style={{
                  width: `${Math.min(100 - remaining, refillPercent)}%`,
                  backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px 4px)`,
                }}
              />
            ) : null}
          </span>
        </span>
        {paceMark ? (
          <span
            className="absolute -inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground ring-1 ring-background"
            style={paceMark.tick}
          />
        ) : null}
      </span>
    </PopoverTrigger>
  );
}

function PoolBar({
  pool,
  color,
  now,
}: {
  readonly pool: LimitPoolWindow;
  readonly color: string;
  readonly now: number;
}) {
  const restores = new Map(pool.resets.map((reset) => [reset.member.account.key, reset]));
  return (
    <div className="grid min-w-0 gap-1">
      {pool.columns.map((member) =>
        member.window ? (
          <PoolSegment
            key={member.account.key}
            account={member.account}
            window={member.window}
            reset={restores.get(member.account.key)}
            refillPercent={member.refillPercent}
            color={normalizeProviderAccentColor(member.account.accentColor) ?? color}
            now={now}
            showAccountName={pool.columns.length > 1}
          />
        ) : null,
      )}
    </div>
  );
}

function PoolWindowCard({
  pool,
  color,
  now,
  label,
  description,
}: {
  readonly pool: LimitPoolWindow;
  readonly color: string;
  readonly now: number;
  readonly label?: string | null | undefined;
  readonly description?: string | undefined;
}) {
  const gt = useGT();
  const windowLabel = useQuotaWindowLabel();
  const nextRefill = pool.resets.find((reset) => reset.restoresPercent > 0);
  return (
    <div className="grid min-w-0 gap-1 border-t border-border/60 pt-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        {label !== null ? (
          <span className="min-w-0 text-xs font-medium text-muted-foreground">
            {windowLabel(label ?? pool.label)}
          </span>
        ) : null}
        <span className="ms-auto flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={cn("text-sm font-semibold tabular-nums", quotaTone(pool.remainingPercent))}
            aria-label={gt("{value0}% remaining", { value0: pool.remainingPercent })}
          >
            {pool.remainingPercent}%
          </span>
          {pool.pace ? <PaceIcon pace={pool.pace} /> : null}
        </span>
      </div>
      <PoolBar pool={pool} color={color} now={now} />
      {nextRefill && pool.columns.length > 1 ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          ↻ +{nextRefill.restoresPercent}%
        </span>
      ) : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function PoolResetActions({
  account,
  destination,
  choices,
  showAccount,
}: {
  readonly account: LimitAccount;
  readonly destination: NonNullable<LimitAccount["redeem"]>;
  readonly choices: readonly ResetCreditChoice[];
  readonly showAccount: boolean;
}) {
  const gt = useGT();
  const reset = useResetCredit(destination.environmentId);
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
      {showAccount ? (
        <AccountName account={account} className="truncate text-xs text-muted-foreground" />
      ) : null}
      {choices.map((choice) => (
        <Button
          key={choice.key}
          size="xs"
          variant="warning-outline"
          disabled={reset.busy || !reset.canManageProviders}
          onClick={() => reset.confirm(choice)}
        >
          <TicketIcon aria-hidden />
          {choices.length === 1
            ? gt("Reset credits ×{value0}", { value0: choice.availableCount })
            : choice.summary}
        </Button>
      ))}
      <ResetCreditDialog
        open={reset.confirming}
        onOpenChange={reset.setConfirming}
        choice={reset.choice}
        onConfirm={() => void reset.redeem()}
        disabled={!reset.canManageProviders}
      />
      {reset.busy || reset.status ? (
        <span className="w-full text-end text-xs text-muted-foreground" role="status">
          {reset.busy ? gt("Using reset credit…") : reset.status}
        </span>
      ) : null}
    </div>
  );
}

type QuotaCard = {
  readonly pool: LimitPool;
  readonly label: string;
  readonly windows: readonly LimitPoolWindow[];
  readonly primary: LimitPoolWindow;
  readonly lowest: LimitPoolWindow;
};

function quotaCards(pools: readonly LimitPool[]): readonly QuotaCard[] {
  const order: readonly string[] = ["codex", "claudeAgent", "antigravity"];
  const rank = (driver: string) => {
    const index = order.indexOf(driver);
    return index < 0 ? order.length : index;
  };
  return [...pools]
    .sort((a, b) => rank(a.driver) - rank(b.driver))
    .flatMap((pool) => {
      const windows = displayLimitWindows(pool);
      const primary = windows.find((window) => window.kind === "weekly") ?? windows[0];
      if (!primary) return [];
      return [
        {
          pool,
          label: providerClients.get(pool.driver)?.label ?? String(pool.driver),
          windows,
          primary,
          lowest: windows.reduce(
            (lowest, window) =>
              window.remainingPercent < lowest.remainingPercent ? window : lowest,
            primary,
          ),
        },
      ];
    });
}

function QuotaOverview({ cards }: { readonly cards: readonly QuotaCard[] }) {
  const gt = useGT();
  const windowLabel = useQuotaWindowLabel();
  const lowCount = cards.filter(
    ({ lowest }) => lowest.remainingPercent <= LOW_QUOTA_PERCENT,
  ).length;
  return (
    <section className="grid gap-2.5 rounded-xl border border-border/60 bg-linear-to-br from-card to-muted/35 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          <T>Quota overview</T>
        </h2>
        {lowCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
            <AlertTriangleIcon aria-hidden className="size-3.5" />
            {gt("Low quota in {value0} of {value1} providers", {
              value0: lowCount,
              value1: cards.length,
            })}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cards.map(({ pool, label, lowest }) => (
          <span
            key={pool.driver}
            className="inline-flex flex-wrap items-baseline gap-x-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs"
          >
            <span className="font-medium">{label}</span>
            <span className="text-muted-foreground">{windowLabel(lowest.label)}</span>
            <span className={cn("font-semibold tabular-nums", quotaTone(lowest.remainingPercent))}>
              {lowest.remainingPercent}%
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}

function PoolSection({ card, now }: { readonly card: QuotaCard; readonly now: number }) {
  const gt = useGT();
  const windowLabel = useQuotaWindowLabel();
  const { pool, label, windows, primary } = card;
  const color = barColor(pool.driver);
  const plans = [
    ...new Set(pool.accounts.flatMap((account) => (account.plan ? [account.plan] : []))),
  ];
  const resetActions = pool.accounts.flatMap((account) => {
    const destination = account.redeem;
    const credits = account.limits.resetCredits;
    if (!destination || !credits?.availableCount) return [];
    const choices = resetCreditChoices(credits, destination.input, now, true).filter(
      (choice) => choice.availableCount > 0,
    );
    return choices.length ? [{ account, destination, choices }] : [];
  });
  return (
    <section className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/70">
            <ProviderInstanceIcon
              driverKind={pool.driver}
              displayName={label}
              indicatorBackground="var(--muted)"
              className="size-6"
              iconClassName="size-5 text-foreground/80"
            />
          </span>
          <div className="min-w-0 space-y-0.5">
            <h2 className="truncate text-sm font-semibold text-foreground">{label}</h2>
            {plans.length > 0 ? (
              <div className="truncate text-xs text-muted-foreground">{plans.join(" · ")}</div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <span
            role="img"
            aria-label={gt("{value0}, {value1}% remaining", {
              value0: windowLabel(primary.label),
              value1: primary.remainingPercent,
            })}
            className={cn(
              "grid size-10 place-items-center rounded-full",
              quotaTone(primary.remainingPercent),
            )}
            style={{
              backgroundImage: `conic-gradient(currentColor ${primary.remainingPercent}%, var(--border) 0)`,
            }}
          >
            <span className="grid size-[34px] place-items-center rounded-full bg-card text-xs font-semibold text-foreground tabular-nums">
              {primary.remainingPercent}%
            </span>
          </span>
          <span className="max-w-24 truncate text-2xs text-muted-foreground">
            {windowLabel(primary.label)}
          </span>
        </div>
      </header>
      {windows.map((window) => {
        const details =
          pool.driver === "cursor" ? cursorUsageWindowDetails(window.id, pool) : undefined;
        return (
          <PoolWindowCard
            key={`${window.kind}:${window.id}`}
            pool={window}
            color={color}
            now={now}
            label={details?.label}
            description={details?.description}
          />
        );
      })}
      {resetActions.length > 0 ? (
        <footer className="mt-auto flex flex-wrap justify-end gap-1.5 border-t border-border/60 pt-2.5">
          {resetActions.map((action) => (
            <PoolResetActions
              key={action.account.key}
              {...action}
              showAccount={pool.accounts.length > 1}
            />
          ))}
        </footer>
      ) : null}
    </section>
  );
}

function UpcomingQuotaResets({
  cards,
  now,
}: {
  readonly cards: readonly QuotaCard[];
  readonly now: number;
}) {
  const timestampFormat = usePrimarySettings((settings) => settings.timestampFormat);
  const windowLabel = useQuotaWindowLabel();
  const resets = cards
    .flatMap(({ label, pool, windows }) =>
      windows.flatMap((window) =>
        window.resets.flatMap((reset) =>
          reset.at > now && reset.restoresPercent > 0
            ? [
                {
                  key: `${pool.driver}:${window.id}:${reset.member.account.key}`,
                  label,
                  window,
                  at: reset.at,
                },
              ]
            : [],
        ),
      ),
    )
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);
  if (!resets.length) return null;
  return (
    <section className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border/70 bg-linear-to-br from-card to-muted/40 p-3.5 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <ClockIcon className="size-4 text-muted-foreground" aria-hidden />
        <T>Upcoming quota resets</T>
      </h2>
      <ul className="grid gap-2">
        {resets.map(({ key, label, window, at }) => (
          <li
            key={key}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-t border-border/60 pt-2 text-xs"
          >
            <span className="min-w-0 font-medium">
              {label} · {windowLabel(window.label)}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatUpcomingTimestamp(new Date(at).toISOString(), timestampFormat, now)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UsageLimitsPooled({
  presentations,
  now,
}: {
  readonly presentations: Parameters<typeof collectLimitAccounts>[0];
  readonly now: number;
}) {
  const [segmentPopover] = useState(() => PopoverCreateHandle<SegmentPayload>());
  const segmentPopoverActions = useRef<PopoverPrimitive.Root.Actions | null>(null);
  const pools = collectLimitPools(collectLimitAccounts(presentations), now);
  const cards = quotaCards(pools);
  const notices = collectLimitNotices(presentations);
  const externalLinks = collectExternalUsageLinks(presentations);
  return (
    <div className="@container/usage-limits flex flex-col gap-4">
      {cards.length === 0 && notices.length === 0 && externalLinks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <T>No provider on the selected environments reports subscription limits.</T>
        </p>
      ) : null}
      {cards.length > 0 ? <QuotaOverview cards={cards} /> : null}
      <SegmentPopoverContext value={segmentPopover}>
        {cards.length > 0 ? (
          <div
            className={cn(
              "grid min-w-0 gap-3",
              cards.length > 1 && "@min-[36rem]/usage-limits:grid-cols-2",
            )}
          >
            {cards.map((card) => (
              <PoolSection key={card.pool.driver} card={card} now={now} />
            ))}
            {cards.length === 3 ? <UpcomingQuotaResets cards={cards} now={now} /> : null}
          </div>
        ) : null}
      </SegmentPopoverContext>
      <Popover handle={segmentPopover} actionsRef={segmentPopoverActions}>
        {({ payload }) =>
          payload ? (
            <ActiveSegmentPopover
              handle={segmentPopover}
              actions={segmentPopoverActions}
              payload={payload}
              pools={pools}
              now={now}
            />
          ) : null
        }
      </Popover>
      {externalLinks.map((link) => (
        <section
          key={link.url}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {link.url === CHATGPT_USAGE_URL ? (
              <OpenAI className="size-5 shrink-0" aria-hidden="true" />
            ) : null}
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-medium">{link.label}</h2>
              <p className="text-xs break-words text-muted-foreground">
                {link.accounts.join(", ")}
              </p>
              {link.url === CHATGPT_USAGE_URL ? (
                <p className="text-xs text-muted-foreground">
                  <T>View usage in ChatGPT with your connected account.</T>
                </p>
              ) : link.message ? (
                <p className="max-w-xl text-xs text-muted-foreground">{link.message}</p>
              ) : null}
            </div>
          </div>
          <Button
            variant="ghost-muted"
            size="xs"
            onClick={() => void ensureLocalApi().shell.openExternal(link.url)}
          >
            <T>Manage usage</T>
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </Button>
        </section>
      ))}
      <LimitNotices notices={notices} />
    </div>
  );
}

function LimitNotices({ notices }: { readonly notices: readonly string[] }) {
  if (notices.length === 0) return null;
  return (
    <Alert variant="warning" controlAlignment="first-line">
      <AlertTriangleIcon />
      {notices.map((notice) => (
        <AlertTitle key={notice} className="break-words">
          {notice}
        </AlertTitle>
      ))}
    </Alert>
  );
}
