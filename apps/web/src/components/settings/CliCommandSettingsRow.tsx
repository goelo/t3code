import { T, useGT, msg } from "gt-react";
import { useState } from "react";

import {
  desktopCliCommandStateAtom,
  getDesktopCliCommandBridge,
  refreshDesktopCliCommandState,
} from "~/state/desktopCliCommand";
import { useEnvironmentQuery } from "~/state/query";
import { Button } from "../ui/button";
import { stackedThreadToast, toastManager } from "../ui/toast";
import { SettingsRow } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";

const FAILURE_TITLES = {
  install: msg("Could not install t3"),
  uninstall: msg("Could not remove t3"),
  addToPath: msg("Could not add t3 to PATH"),
} as const;

/** The desktop `t3` command's state, and its actions with a toast on failure. */
export function useDesktopCliCommand() {
  const gt = useGT();
  const bridge = getDesktopCliCommandBridge();
  const query = useEnvironmentQuery(bridge ? desktopCliCommandStateAtom : null);
  const [pending, setPending] = useState(false);

  const run = (action: keyof typeof FAILURE_TITLES) => {
    if (!bridge || pending) return;
    setPending(true);
    void bridge[action]()
      .then(refreshDesktopCliCommandState)
      .catch((error: unknown) => {
        toastManager.add(
          stackedThreadToast({
            type: "error",
            title: FAILURE_TITLES[action],
            description: error instanceof Error ? error.message : gt("Something went wrong."),
          }),
        );
      })
      .finally(() => setPending(false));
  };

  return {
    state: bridge ? query.data : undefined,
    busy: pending || query.isPending,
    run,
  };
}

export function CliCommandSettingsRow() {
  const gt = useGT();
  const { state, busy, run } = useDesktopCliCommand();

  if (!state?.supported) return null;
  const installed = state.installedPath !== null;
  const description = state.shadowedBy
    ? gt("Another t3 at {value0} runs first in a new terminal. Remove it to use T3 Code's.", {
        value0: state.shadowedBy,
      })
    : !installed
      ? gt("Run T3 Code's CLI as `t3` from any terminal.")
      : state.onPath
        ? gt("Installed at {value0}. Open a new terminal to use it.", {
            value0: state.installedPath,
          })
        : state.pathSetup?.added
          ? gt(
              "Installed at {value0} and added to PATH in {value1}. Open a new terminal to use it.",
              { value0: state.installedPath, value1: state.pathSetup.file },
            )
          : gt("Installed at {value0}, which is not on your PATH yet.{value1}", {
              value0: state.installedPath,
              value1: state.pathSetup ? "" : gt(" Add its folder to your PATH to run `t3`."),
            });

  return (
    <SettingsRow
      {...searchableSetting("cli-command")}
      description={description}
      control={
        <div className="flex gap-2">
          {state.pathSetup && !state.pathSetup.added ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run("addToPath")}>
              <T>Add to PATH</T>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={busy || (!installed && Boolean(state.shadowedBy))}
            onClick={() => run(installed ? "uninstall" : "install")}
          >
            {installed ? gt("Remove") : gt("Install")}
          </Button>
        </div>
      }
    />
  );
}
