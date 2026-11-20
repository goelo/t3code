import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
import type { ChangeRequestTerminology } from "@t3tools/client-runtime/source-control-clients";

export function offHeadPullRequestCheckoutToast(terminology: ChangeRequestTerminology) {
  return {
    type: "warning",
    title: translateMessage(msg("Checked out, but not confirmed on the latest commit")),
    description: translateMessage(
      msg(
        "This checkout could not be confirmed at the {value0}'s latest commit, so its code may differ. Local commits or uncommitted work keep a checkout where it is.",
      ),
      { value0: terminology.singular },
    ),
  } as const;
}
