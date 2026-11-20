import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
import type { LinkedPrompt } from "@t3tools/shared/promptLinks";

import { type ComposerThreadTarget, useComposerDraftStore } from "~/composerDraftStore";

import { toastManager } from "../ui/toast";

export function warnAboutHiddenCharacters(prompt: LinkedPrompt): void {
  if (prompt.hiddenCharacters === 0) return;
  toastManager.add({
    type: "warning",
    title: translateMessage(msg("This prompt had hidden characters, it may be malicious")),
    description: translateMessage(
      msg("T3 Code removed {value0} hidden character{value1}. Read the prompt before you send it."),
      { value0: prompt.hiddenCharacters, value1: prompt.hiddenCharacters === 1 ? "" : "s" },
    ),
    timeout: 0,
  });
}

export function placeLinkedPrompt(
  target: ComposerThreadTarget,
  prompt: LinkedPrompt,
  notes: ReadonlyArray<string> = [],
): void {
  warnAboutHiddenCharacters(prompt);
  const place = () => {
    useComposerDraftStore.getState().setPrompt(target, prompt.text);
    toastManager.add({
      type: "info",
      title: translateMessage(msg("Prompt added from a link")),
      description: ["Read it before you send.", ...notes].join(" "),
    });
  };
  const existing = useComposerDraftStore.getState().getComposerDraft(target)?.prompt ?? "";
  if (existing.trim().length === 0 || existing === prompt.text) {
    place();
    return;
  }
  const id = toastManager.add({
    type: "info",
    title: translateMessage(msg("Linked prompt ready")),
    description: translateMessage(
      msg("This thread already has a draft. Replace it with the linked prompt?"),
    ),
    timeout: 0,
    actionProps: {
      children: "Replace draft",
      onClick: () => {
        toastManager.close(id);
        place();
      },
    },
  });
}
