import type { ServerProviderUsageWindow } from "@t3tools/contracts";
import { expect, it } from "vite-plus/test";
import { composerQuotaPools } from "./composerQuotaPools";

const windows = [
  { id: "gemini-5h", kind: "session", label: "Gemini · 5-hour", usedPercent: 100 },
  { id: "gemini-weekly", kind: "weekly", label: "Gemini · Weekly", usedPercent: 96 },
  { id: "gemini-argon-weekly", kind: "weekly", label: "Gemini 4 Argon · Weekly", usedPercent: 84 },
  { id: "3p-weekly", kind: "weekly", label: "Claude & GPT (shared) · Weekly", usedPercent: 0 },
] satisfies ServerProviderUsageWindow[];

it.each([
  ["gemini-4-argon-high", "gemini-argon"],
  ["gemini-4-neon", "gemini"],
  ["anthropic/claude-opus", "3p"],
  ["gpt-6-luna", "3p"],
])("selects only the applicable quota pool for %s", (model, pool) => {
  expect(
    composerQuotaPools("antigravity", windows, model).filter((entry) => entry.current),
  ).toMatchObject([{ key: pool }]);
});
