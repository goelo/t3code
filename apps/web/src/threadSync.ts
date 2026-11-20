import { translateMessage } from "./i18n/translateMessage";
import { msg } from "gt-react";
import type { EnvironmentThreadStatus } from "@t3tools/client-runtime/state/threads";

export type ThreadSyncPhase = "loading" | "syncing";

export function resolveThreadSyncPhase(input: {
  readonly detailExists: boolean;
  readonly shellExists: boolean;
  readonly status: EnvironmentThreadStatus;
}): ThreadSyncPhase | null {
  if (!input.shellExists) {
    return null;
  }

  switch (input.status) {
    case "empty":
    case "cached":
    case "synchronizing":
      return input.detailExists ? "syncing" : "loading";
    case "deleted":
    case "live":
      return null;
  }
}

export function threadSyncLabel(phase: ThreadSyncPhase): string {
  return phase === "loading"
    ? translateMessage(msg("Loading messages..."))
    : translateMessage(msg("Syncing messages..."));
}
