import { T } from "gt-react";
import { cn } from "~/lib/utils";

import { CommandBlock } from "./CommandBlock";

/**
 * Setup steps for another computer: install `t3`, then run `command`. Both installers are shown
 * because the browser showing this is often not the computer being set up.
 */
export function InstallT3Commands({
  command,
  className,
}: {
  readonly command: string;
  readonly className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">
        <T>macOS, Linux</T>
      </p>
      <CommandBlock command="curl -fsSL https://t3.codes/install.sh | sh" />
      <p className="text-xs text-muted-foreground">
        <T>Windows (PowerShell)</T>
      </p>
      <CommandBlock command="irm https://t3.codes/install.ps1 | iex" />
      <p className="text-xs text-muted-foreground">
        <T>Then</T>
      </p>
      <CommandBlock command={command} />
      <p className="text-xs text-muted-foreground">
        <T>Skip the install if you already have </T>
        <code className="font-mono">t3</code>
        <T>. If</T> <code className="font-mono">t3</code>
        <T> is not found after installing, add the folder the installer names to your PATH.</T>
      </p>
    </div>
  );
}
