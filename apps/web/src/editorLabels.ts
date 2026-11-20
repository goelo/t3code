import { translateMessage } from "./i18n/translateMessage";
import { msg } from "gt-react";
import { EDITORS, type EditorId } from "@t3tools/contracts";

import { getLocalFileManagerName } from "~/lib/utils";

const editorLabels = new Map<EditorId, string>(EDITORS.map((editor) => [editor.id, editor.label]));

export function editorLabelForPlatform(editorId: EditorId, platform: string): string {
  if (editorId === "file-manager") {
    return getLocalFileManagerName(platform);
  }

  return editorLabels.get(editorId) ?? translateMessage(msg("Editor"));
}

export function openInEditorMenuLabel(editorId: EditorId | null): string {
  return editorId === null || editorId === "file-manager"
    ? translateMessage(msg("Open in editor"))
    : translateMessage(msg("Open in {value0}"), {
        value0: editorLabels.get(editorId) ?? translateMessage(msg("Editor")),
      });
}
