import { translateMessage } from "../i18n/translateMessage";
import { msg } from "gt-react";
import { appAtomRegistry } from "../rpc/atomRegistry";
import { primaryServerLegacyThreadMigrationAtom } from "../state/server";
import { toastManager } from "./ui/toast";

type MigrationToastId = ReturnType<typeof toastManager.add>;

/** A loading toast for as long as the primary server reports a legacy thread migration running. */
export function startLegacyThreadMigrationToast(): () => void {
  let toastId: MigrationToastId | null = null;

  const unsubscribe = appAtomRegistry.subscribe(
    primaryServerLegacyThreadMigrationAtom,
    (migration) => {
      if (migration?.status === "running") {
        if (toastId !== null) return;
        toastId = toastManager.add({
          type: "loading",
          title: translateMessage(msg("Restoring your threads…")),
          description: translateMessage(
            msg(
              "Migrating {value0} {value1} from the previous version. You can keep working while this finishes.",
            ),
            {
              value0: migration.totalThreadCount.toLocaleString(),
              value1: migration.totalThreadCount === 1 ? "thread" : "threads",
            },
          ),
          timeout: 0,
        });
        return;
      }

      if (toastId !== null) {
        toastManager.close(toastId);
        toastId = null;
      }
    },
    { immediate: true },
  );

  return () => {
    unsubscribe();
    if (toastId !== null) toastManager.close(toastId);
  };
}
