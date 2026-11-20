import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
import type { ExecutionEnvironmentPlatformOs, FileManagerRevealKind } from "@t3tools/contracts";

export function revealInFileExplorerLabel(platform: string): string {
  const normalized = platform.toLowerCase();
  if (normalized.includes("mac")) return translateMessage(msg("Reveal in Finder"));
  if (normalized.includes("win")) return translateMessage(msg("Reveal in File Explorer"));
  return translateMessage(msg("Reveal in Files"));
}

export function revealInFileExplorerLabelForOs(os: ExecutionEnvironmentPlatformOs): string {
  if (os === "darwin") return translateMessage(msg("Reveal in Finder"));
  if (os === "windows") return translateMessage(msg("Reveal in File Explorer"));
  return translateMessage(msg("Reveal in Files"));
}

export function revealInFileExplorerLabelForKind(kind: FileManagerRevealKind): string {
  if (kind === "finder") return translateMessage(msg("Reveal in Finder"));
  if (kind === "file-explorer") return translateMessage(msg("Reveal in File Explorer"));
  return translateMessage(msg("Reveal in Files"));
}
