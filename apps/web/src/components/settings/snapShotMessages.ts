import { msg } from "gt-react";
import { translateMessage } from "../../i18n/translateMessage";

const MESSAGES: Readonly<Record<string, string>> = {
  "Allow Accessibility and Screen Recording in System Settings, then restart T3 Code.": msg(
    "Allow Accessibility and Screen Recording in System Settings, then restart T3 Code.",
  ),
  "Allow Accessibility in System Settings, then restart T3 Code.": msg(
    "Allow Accessibility in System Settings, then restart T3 Code.",
  ),
  "Allow Screen Recording in System Settings, then restart T3 Code.": msg(
    "Allow Screen Recording in System Settings, then restart T3 Code.",
  ),
  "Change the capture binding in your Hyprland config, then save it.": msg(
    "Change the capture binding in your Hyprland config, then save it.",
  ),
  "Config setup requires a Niri or Hyprland session.": msg(
    "Config setup requires a Niri or Hyprland session.",
  ),
  "Configure the capture shortcut in your Niri config, not in T3 Code.": msg(
    "Configure the capture shortcut in your Niri config, not in T3 Code.",
  ),
  "Could not capture the active window.": msg("Could not capture the active window."),
  "Could not list pending snapshots.": msg("Could not list pending snapshots."),
  "Could not open shortcut permissions.": msg("Could not open shortcut permissions."),
  "Could not read the snapshot.": msg("Could not read the snapshot."),
  "Could not register the SnapShot shortcut.": msg("Could not register the SnapShot shortcut."),
  "Could not remove the snapshot.": msg("Could not remove the snapshot."),
  "Enable SnapShots in Settings first.": msg("Enable SnapShots in Settings first."),
  "Finish SnapShot setup in Settings \u2192 SnapShots.": msg(
    "Finish SnapShot setup in Settings \u2192 SnapShots.",
  ),
  "Modifier-pair shortcuts aren't available in this Wayland session. Choose another shortcut or use Take snapshot from the command palette.":
    msg(
      "Modifier-pair shortcuts aren't available in this Wayland session. Choose another shortcut or use Take snapshot from the command palette.",
    ),
  "No window was selected.": msg("No window was selected."),
  "SnapShots are not supported here.": msg("SnapShots are not supported here."),
  "SnapShots are not supported on this platform.": msg(
    "SnapShots are not supported on this platform.",
  ),
  "Test capture requires macOS.": msg("Test capture requires macOS."),
  "The active window is not available for capture.": msg(
    "The active window is not available for capture.",
  ),
  "The system could not register this shortcut.": msg(
    "The system could not register this shortcut.",
  ),
  "This shortcut is already used by the system or another app.": msg(
    "This shortcut is already used by the system or another app.",
  ),
  "Your desktop will confirm this shortcut when you save it.": msg(
    "Your desktop will confirm this shortcut when you save it.",
  ),
};

/** Translate known app messages while preserving system output and diagnostic details. */
export function localizeSnapShotMessage(message: string): string {
  const source = MESSAGES[message];
  return source === undefined ? message : translateMessage(source);
}
