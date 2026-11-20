import { msg, useMessages } from "gt-react";

const messages: Readonly<Record<string, string>> = {
  "ACP Registry": msg("ACP Registry"),
  "ACP source": msg("ACP source"),
  "API key": msg("API key"),
  "Account-specific Codex home. Keeps auth.json separate while sharing state from CODEX_HOME.": msg(
    "Account-specific Codex home. Keeps auth.json separate while sharing state from CODEX_HOME.",
  ),
  "Additional CLI arguments passed on session start.": msg(
    "Additional CLI arguments passed on session start.",
  ),
  "Additional CLI arguments passed to codex app-server on session start.": msg(
    "Additional CLI arguments passed to codex app-server on session start.",
  ),
  "Additional CLI arguments passed to pi --mode rpc on session start.": msg(
    "Additional CLI arguments passed to pi --mode rpc on session start.",
  ),
  "Agent Platform (Vertex AI)": msg("Agent Platform (Vertex AI)"),
  "Agent identifier from the official ACP Registry, for example 'devin'.": msg(
    "Agent identifier from the official ACP Registry, for example 'devin'.",
  ),
  "Authentication method": msg("Authentication method"),
  "Auto-compact after": msg("Auto-compact after"),
  Automatic: msg("Automatic"),
  "Before the cache expires (beta)": msg("Before the cache expires (beta)"),
  "Binary path": msg("Binary path"),
  "CLAUDE_CONFIG_DIR path": msg("CLAUDE_CONFIG_DIR path"),
  "CODEX_HOME path": msg("CODEX_HOME path"),
  "Compact after 100,000 to 1,000,000 tokens. Leave empty to use Claude's default.": msg(
    "Compact after 100,000 to 1,000,000 tokens. Leave empty to use Claude's default.",
  ),
  "Compact idle threads": msg("Compact idle threads"),
  Cursor: msg("Cursor"),
  "Cursor API key": msg("Cursor API key"),
  "Custom ACP executable. Leave empty to select automatically.": msg(
    "Custom ACP executable. Leave empty to select automatically.",
  ),
  "Custom Claude home and config directory. Keeps .claude.json and .claude separate.": msg(
    "Custom Claude home and config directory. Keeps .claude.json and .claude separate.",
  ),
  "Custom Codex home and config directory.": msg("Custom Codex home and config directory."),
  "Executable on this environment. For registry agents, this overrides the distribution executable while keeping its arguments and environment.":
    msg(
      "Executable on this environment. For registry agents, this overrides the distribution executable while keeping its arguments and environment.",
    ),
  "Executable override": msg("Executable override"),
  "GCP location": msg("GCP location"),
  "GCP project": msg("GCP project"),
  "Gemini API key": msg("Gemini API key"),
  "Gemini Enterprise": msg("Gemini Enterprise"),
  "Gemini or Vertex AI express key. Stored separately on the host.": msg(
    "Gemini or Vertex AI express key. Stored separately on the host.",
  ),
  "Google account": msg("Google account"),
  "Google accounts use your subscription; API keys and Agent Platform bill usage.": msg(
    "Google accounts use your subscription; API keys and Agent Platform bill usage.",
  ),
  Grok: msg("Grok"),
  Kiro: msg("Kiro"),
  "Kiro API key": msg("Kiro API key"),
  "Launch arguments": msg("Launch arguments"),
  "Leave blank to let T3 Code spawn the server when needed.": msg(
    "Leave blank to let T3 Code spawn the server when needed.",
  ),
  "Local command": msg("Local command"),
  "Muse Code": msg("Muse Code"),
  Never: msg("Never"),
  OpenCode: msg("OpenCode"),
  Optional: msg("Optional"),
  "Optional ACP authentication method ID. By default, the first agent-managed method is selected.":
    msg(
      "Optional ACP authentication method ID. By default, the first agent-managed method is selected.",
    ),
  "Optional. Overrides browser sign-in for this provider.": msg(
    "Optional. Overrides browser sign-in for this provider.",
  ),
  "Optional. Signs in without `kiro-cli login` (Kiro Pro and above).": msg(
    "Optional. Signs in without `kiro-cli login` (Kiro Pro and above).",
  ),
  "Paste API key": msg("Paste API key"),
  "Path to the Claude binary used by this instance.": msg(
    "Path to the Claude binary used by this instance.",
  ),
  "Path to the Codex binary used by this instance.": msg(
    "Path to the Codex binary used by this instance.",
  ),
  "Path to the Grok CLI binary.": msg("Path to the Grok CLI binary."),
  "Path to the Kiro CLI binary.": msg("Path to the Kiro CLI binary."),
  "Path to the Muse Code binary on this environment. Sign in with muse login on that host.": msg(
    "Path to the Muse Code binary on this environment. Sign in with muse login on that host.",
  ),
  "Path to the OpenCode binary.": msg("Path to the OpenCode binary."),
  "Path to the Pi coding agent binary.": msg("Path to the Pi coding agent binary."),
  "Path to the fx binary. All fx instances on this machine share its fx login.": msg(
    "Path to the fx binary. All fx instances on this machine share its fx login.",
  ),
  Pi: msg("Pi"),
  "Region for Gemini Enterprise or Agent Platform.": msg(
    "Region for Gemini Enterprise or Agent Platform.",
  ),
  "Registry agent ID": msg("Registry agent ID"),
  "Registry default": msg("Registry default"),
  "Required for Gemini Enterprise. Agent Platform uses it when no API key is set.": msg(
    "Required for Gemini Enterprise. Agent Platform uses it when no API key is set.",
  ),
  "Server URL": msg("Server URL"),
  "Server password": msg("Server password"),
  "Shadow home path": msg("Shadow home path"),
  "Sign-in method": msg("Sign-in method"),
  "Stored separately on the host.": msg("Stored separately on the host."),
  "Use default": msg("Use default"),
  "When to compact an idle thread over 200,000 tokens: after you return, just before its prompt cache expires, or never. Overrides the default in Providers > Advanced.":
    msg(
      "When to compact an idle thread over 200,000 tokens: after you return, just before its prompt cache expires, or never. Overrides the default in Providers > Advanced.",
    ),
  "When you return": msg("When you return"),
  auto: msg("auto"),
  claude: msg("claude"),
  codex: msg("codex"),
  devin: msg("devin"),
  "e.g. --chrome": msg("e.g. --chrome"),
  "e.g. 300000": msg("e.g. 300000"),
  fx: msg("fx"),
  grok: msg("grok"),
  "kiro-cli": msg("kiro-cli"),
  muse: msg("muse"),
  "my-project-id": msg("my-project-id"),
  opencode: msg("opencode"),
  pi: msg("pi"),
  "us-central1": msg("us-central1"),
  "~/.claude": msg("~/.claude"),
  "~/.codex": msg("~/.codex"),
  "~/.codex-t3/personal": msg("~/.codex-t3/personal"),
};

export function useProviderSettingsMessages() {
  const m = useMessages();
  return (source: string) => m(messages[source] ?? source);
}
