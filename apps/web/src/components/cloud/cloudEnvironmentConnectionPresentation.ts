import { translateMessage } from "../../i18n/translateMessage";
import { msg } from "gt-react";
import {
  connectionStatusText,
  type EnvironmentConnectionPresentation,
} from "@t3tools/client-runtime/connection";

export interface SavedCloudEnvironmentConnectionPresentation {
  readonly buttonLabel: string;
  readonly statusText: string;
  readonly tone: "connected" | "connecting" | "error" | "idle";
}

export function presentSavedCloudEnvironmentConnection(
  connection: EnvironmentConnectionPresentation,
): SavedCloudEnvironmentConnectionPresentation {
  switch (connection.phase) {
    case "connected":
      return {
        buttonLabel: translateMessage(msg("Connected")),
        statusText: connectionStatusText(connection),
        tone: "connected",
      };
    case "connecting":
      return {
        buttonLabel: translateMessage(msg("Connecting…")),
        statusText: connectionStatusText(connection),
        tone: "connecting",
      };
    case "reconnecting":
      return {
        buttonLabel: translateMessage(msg("Reconnecting…")),
        statusText: connectionStatusText(connection),
        tone: "connecting",
      };
    case "unsupported":
      return {
        buttonLabel: translateMessage(msg("Client not supported")),
        statusText: connectionStatusText(connection),
        tone: "idle",
      };
    case "error":
      return {
        buttonLabel: translateMessage(msg("Connection failed")),
        statusText: connectionStatusText(connection),
        tone: "error",
      };
    case "offline":
      return {
        buttonLabel: translateMessage(msg("Offline")),
        statusText: connectionStatusText(connection),
        tone: "idle",
      };
    case "available":
      return {
        buttonLabel: translateMessage(msg("Not connected")),
        statusText: connectionStatusText(connection),
        tone: "idle",
      };
  }
}
