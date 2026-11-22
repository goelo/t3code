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
import { AlertTriangleIcon, ExternalLinkIcon, TicketIcon } from "lucide-react";
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
  const payload: SegmentPayload = { account, window, reset, redeem };
  const remaining = remainingPercent(window);
  const timeLeft = paceRemainingPercent(window, now);
  const [segmentRef, paceMark] = usePaceMark(timeLeft);
  const resetsIn = formatResetsIn(window, now);
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
            {resetsIn?.replace("resets in ", "↻ ") ?? ""}
            {credits ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-accent px-1.5 font-medium text-foreground">
                <TicketIcon className="size-3" aria-hidden />
                {credits}
              </span>
            ) : null}
          </span>
        </span>
      ) : null}
      <span ref={segmentRef} aria-hidden className="relative h-2.5 w-full">
        <span className="absolute inset-0" style={{ maskImage: QUOTA_CELLS_MASK }}>
          <span className="absolute inset-0 rounded-sm bg-muted" />
          <span className="absolute inset-0" style={paceMark?.gap}>
            <span
              className="absolute inset-y-0 left-0 opacity-75"
              style={{ width: `${remaining}%`, backgroundColor: color }}
            />
            {remaining < 100 && reset && refillPercent > 0 ? (
              <span
                className="absolute inset-y-0 right-0 opacity-30"
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
  const nextRefill = pool.resets.find((reset) => reset.restoresPercent > 0);
  return (
    <div className="grid min-w-0 gap-1.5 border-t border-border/60 pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        {label !== null ? (
          <span className="min-w-0 text-sm font-medium text-foreground">{label ?? pool.label}</span>
        ) : null}
        <span className="ms-auto flex items-baseline gap-1.5 whitespace-nowrap">
          <span
            className={cn(
              "text-xl font-semibold leading-none tabular-nums",
              pool.remainingPercent <= 15 ? "text-warning-foreground" : "text-foreground",
            )}
          >
            {pool.remainingPercent}%
          </span>
          <span className="text-xs text-muted-foreground">
            <T>left</T>
          </span>
          {pool.pace ? <PaceIcon pace={pool.pace} /> : null}
        </span>
      </div>
      {nextRefill && pool.columns.length > 1 ? (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          ↻ +{nextRefill.restoresPercent}%
        </span>
      ) : null}
      <PoolBar pool={pool} color={color} now={now} />
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function PoolSection({ pool, now }: { readonly pool: LimitPool; readonly now: number }) {
  const color = barColor(pool.driver);
  const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
  const windows = displayLimitWindows(pool);
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/70 bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ProviderInstanceIcon
          driverKind={pool.driver}
          displayName={label}
          indicatorBackground="var(--background)"
          className="size-5"
          iconClassName="size-4 text-foreground/80"
        />
        {label}
      </h2>
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
  const notices = collectLimitNotices(presentations);
  const externalLinks = collectExternalUsageLinks(presentations);
  return (
    <div className="@container/usage-limits flex flex-col gap-4">
      {pools.length === 0 && notices.length === 0 && externalLinks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <T>No provider on the selected environments reports subscription limits.</T>
        </p>
      ) : null}
      <SegmentPopoverContext value={segmentPopover}>
        {pools.length > 0 ? (
          <div
            className={cn(
              "grid min-w-0 items-start gap-3",
              pools.length > 1 && "@min-[36rem]/usage-limits:grid-cols-2",
            )}
          >
            {pools.map((pool) => (
              <PoolSection key={pool.driver} pool={pool} now={now} />
            ))}
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
