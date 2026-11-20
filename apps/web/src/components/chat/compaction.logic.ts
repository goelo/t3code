import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
import type { ProviderDriverKind, ProviderInstanceId } from "@t3tools/contracts";
import {
  resolveSelectableProviderInstanceEntry,
  type ProviderInstanceEntry,
} from "../../providerInstances";

function providerSupportsManualCompaction(
  provider: ProviderInstanceEntry | null | undefined,
): boolean {
  return provider?.snapshot.slashCommands.some((command) => command.name === "compact") ?? false;
}

export function hasAvailableCompactionProvider(input: {
  readonly providers: ReadonlyArray<ProviderInstanceEntry>;
  readonly driverKind: ProviderDriverKind;
  readonly instanceId: ProviderInstanceId | null;
  readonly lockedInstanceId: ProviderInstanceId | null;
}): boolean {
  const driverProviders = input.providers.filter(
    (provider) => provider.driverKind === input.driverKind,
  );
  const lockedContinuationGroupKey = input.lockedInstanceId
    ? driverProviders.find((provider) => provider.instanceId === input.lockedInstanceId)
        ?.continuationGroupKey
    : undefined;
  const compatibleProviders = lockedContinuationGroupKey
    ? driverProviders.filter(
        (provider) => provider.continuationGroupKey === lockedContinuationGroupKey,
      )
    : driverProviders;

  return providerSupportsManualCompaction(
    resolveSelectableProviderInstanceEntry(compatibleProviders, input.instanceId ?? undefined),
  );
}

export function formatContextWindowCompactionMessage(autoCompactThreshold?: number | null): string {
  if (typeof autoCompactThreshold === "number" && autoCompactThreshold > 0) {
    return translateMessage(msg("Compacts automatically at about {value0} tokens."), {
      value0: autoCompactThreshold.toLocaleString("en-US"),
    });
  }
  return translateMessage(msg("Context compacts automatically when needed."));
}
