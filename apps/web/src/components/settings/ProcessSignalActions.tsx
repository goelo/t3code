import { useGT, T } from "gt-react";
import type { ServerProcessSignal } from "@t3tools/contracts";

import { InlineButton } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

export function ProcessSignalActions({
  disabled,
  onSignal,
}: {
  disabled: boolean;
  onSignal: (signal: ServerProcessSignal) => void;
}) {
  const gt = useGT();
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <InlineButton
              disabled={disabled}
              aria-label={gt("Send SIGINT")}
              tone="muted"
              onClick={() => onSignal("SIGINT")}
            >
              <T>INT</T>
            </InlineButton>
          }
        />
        <TooltipPopup side="top">
          <T>Send SIGINT</T>
        </TooltipPopup>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <InlineButton
              disabled={disabled}
              aria-label={gt("Send SIGKILL")}
              tone="destructive"
              onClick={() => onSignal("SIGKILL")}
            >
              <T>KILL</T>
            </InlineButton>
          }
        />
        <TooltipPopup side="top">
          <T>Send SIGKILL</T>
        </TooltipPopup>
      </Tooltip>
    </div>
  );
}
