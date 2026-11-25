import type { ProviderDriverKind, ServerProviderUsageWindow } from "@t3tools/contracts";

export function composerQuotaPools(
  driver: ProviderDriverKind,
  windows: readonly ServerProviderUsageWindow[],
  model: string,
) {
  const isAntigravity = driver === "antigravity";
  const pools = new Map<string, ServerProviderUsageWindow[]>();
  for (const window of windows) {
    const key = isAntigravity ? window.id.replace(/-(5h|weekly|quota)$/u, "") : "default";
    const pool = pools.get(key);
    if (pool) pool.push(window);
    else pools.set(key, [window]);
  }
  const slug = model.toLowerCase().split("/").at(-1) ?? "";
  const family = slug.match(/^(gemini|claude|gpt)-/u)?.[1];
  const dedicated = slug.includes("argon")
    ? "gemini-argon"
    : slug.includes("carbon")
      ? "gemini-carbon"
      : null;
  const selected = !isAntigravity
    ? "default"
    : dedicated && pools.has(dedicated)
      ? dedicated
      : (family === "claude" || family === "gpt") && pools.has("3p")
        ? "3p"
        : family;

  return [...pools].map(([key, windows]) => ({
    key,
    label: isAntigravity ? (windows[0]?.label.split(" · ")[0] ?? key) : null,
    windows,
    current: key === selected,
  }));
}
