import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
/** Diff failures currently include transport wrappers, so recognize the reason inside them. */
export function describePullRequestDiffError(error: string, providerName: string, term: string) {
  if (/\brate limit\b|\brate[-_]limited\b|\btoo many requests\b/i.test(error)) {
    return {
      title: translateMessage(msg("{value0} rate limit reached"), { value0: providerName }),
      description: translateMessage(
        msg(
          "{value0} is temporarily limiting requests, so this diff couldn't be loaded. Try again after the limit resets, or view the changes on {value1}.",
        ),
        { value0: providerName, value1: providerName },
      ),
    };
  }

  return {
    title: translateMessage(msg("Couldn't load the changes")),
    description: translateMessage(
      msg(
        "The environment couldn't load this {value0}'s diff. Try again, or view the changes on {value1}.",
      ),
      { value0: term, value1: providerName },
    ),
  };
}
