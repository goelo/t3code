import { msg, useMessages, useLocale } from "gt-react";

const MESSAGES: Readonly<Record<string, string>> = {
  Minimal: msg("Minimal"),
  Low: msg("Low"),
  Medium: msg("Medium"),
  High: msg("High"),
  "Extra high": msg("Extra high"),
  "Very high": msg("Very high"),
  Max: msg("Max"),
  None: msg("None"),
  Default: msg("Default"),
  Auto: msg("Auto"),
  Adaptive: msg("Adaptive"),
  Standard: msg("Standard"),
  Fast: msg("Fast"),
  Ultrafast: msg("Ultrafast"),
  Priority: msg("Priority"),
  Flex: msg("Flex"),
  On: msg("On"),
  Off: msg("Off"),
  Reasoning: msg("Reasoning"),
  Thinking: msg("Thinking"),
  "Reasoning effort": msg("Reasoning effort"),
  "Thinking budget": msg("Thinking budget"),
  "Service tier": msg("Service tier"),
  "Fast mode": msg("Fast mode"),
  "Context window": msg("Context window"),
  Mode: msg("Mode"),
  Effort: msg("Effort"),
  Context: msg("Context"),
  Plan: msg("Plan"),
  Build: msg("Build"),
  Code: msg("Code"),
  Normal: msg("Normal"),
  "Session mode": msg("Session mode"),
  "Agent mode": msg("Agent mode"),
  "Output format": msg("Output format"),
  "Max tokens": msg("Max tokens"),
  "Extended thinking": msg("Extended thinking"),
  "Adaptive reasoning": msg("Adaptive reasoning"),
  "Adaptive thinking": msg("Adaptive thinking"),
  "Reasoning budget": msg("Reasoning budget"),
  Speed: msg("Speed"),
  Model: msg("Model"),
  Permissions: msg("Permissions"),
  "Full access": msg("Full access"),
  "Auto-accept edits": msg("Auto-accept edits"),
  Supervised: msg("Supervised"),
};

const MESSAGE_BY_LOWERCASE = new Map(
  Object.entries(MESSAGES).map(([key, value]) => [key.toLowerCase(), value]),
);

export function useModelTraitMessages() {
  const m = useMessages();
  const locale = useLocale();
  return (source: string) =>
    source
      .split(/( · |, | \/ |: )/)
      .map((part, index) => {
        const message = MESSAGE_BY_LOWERCASE.get(part.toLowerCase());
        return locale === "en" || index % 2 === 1 || message === undefined ? part : m(message);
      })
      .join("");
}
