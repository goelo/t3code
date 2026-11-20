import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
import { EraserIcon } from "lucide-react";

import type { ComposerBannerStackItem } from "./ComposerBannerStack";

/** Shown while `/clear` is armed; dismissing it keeps the current conversation. */
export function freshSessionBannerItem(onUndo: () => void): ComposerBannerStackItem {
  return {
    id: "fresh-session",
    variant: "info",
    icon: <EraserIcon />,
    title: translateMessage(msg("Your next message starts a fresh session")),
    description: translateMessage(msg("The agent won't see earlier messages in this thread.")),
    dismissLabel: "Keep the current session",
    onDismiss: onUndo,
  };
}
