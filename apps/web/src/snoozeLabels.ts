import { msg } from "gt-react";

import { translateMessage } from "./i18n/translateMessage";

const LABELS: Readonly<Record<string, string>> = {
  "This morning": msg("This morning"),
  "This afternoon": msg("This afternoon"),
  "This evening": msg("This evening"),
  Tomorrow: msg("Tomorrow"),
  "Next week": msg("Next week"),
  Monday: msg("Monday"),
  Tuesday: msg("Tuesday"),
  Wednesday: msg("Wednesday"),
  Thursday: msg("Thursday"),
  Friday: msg("Friday"),
  Saturday: msg("Saturday"),
  Sunday: msg("Sunday"),
  "Next Monday": msg("Next Monday"),
  "Next Tuesday": msg("Next Tuesday"),
  "Next Wednesday": msg("Next Wednesday"),
  "Next Thursday": msg("Next Thursday"),
  "Next Friday": msg("Next Friday"),
  "Next Saturday": msg("Next Saturday"),
  "Next Sunday": msg("Next Sunday"),
};

export function localizeSnoozeLabel(label: string): string {
  const duration = /^In (\d+) (minute|hour|day)s?$/.exec(label);
  if (!duration) {
    const message = LABELS[label];
    return message ? translateMessage(message) : label;
  }
  const value0 = Number(duration[1]);
  if (duration[2] === "day") {
    return translateMessage(value0 === 1 ? msg("In {value0} day") : msg("In {value0} days"), {
      value0,
    });
  }
  if (duration[2] === "hour") {
    return translateMessage(value0 === 1 ? msg("In {value0} hour") : msg("In {value0} hours"), {
      value0,
    });
  }
  return translateMessage(value0 === 1 ? msg("In {value0} minute") : msg("In {value0} minutes"), {
    value0,
  });
}
