import { resolveLocale } from "@t3tools/client-runtime/locales";
import type { MenuItemConstructorOptions } from "electron";

import translations from "./translations/zh.json" with { type: "json" };

let language = "zh";
let locale = "zh";

export function setDesktopLanguage(value: string, systemLanguages: ReadonlyArray<string>): boolean {
  const next = resolveLocale(value, systemLanguages, ["en", "zh"], "en");
  const changed = next !== locale;
  language = value;
  locale = next;
  return changed;
}

export function getDesktopLocale(): string {
  return locale;
}

export function getDesktopLanguageSetting(): string {
  return language;
}

export function desktopT(message: string, values: Readonly<Record<string, unknown>> = {}): string {
  const catalog: Readonly<Record<string, string>> = translations;
  const translated = locale === "zh" ? (catalog[message] ?? message) : message;
  return translated.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

const ROLE_LABELS: Readonly<Record<string, string>> = {
  about: "About",
  services: "Services",
  hide: "Hide",
  hideOthers: "Hide Others",
  unhide: "Show All",
  quit: "Quit",
  undo: "Undo",
  redo: "Redo",
  cut: "Cut",
  copy: "Copy",
  paste: "Paste",
  delete: "Delete",
  selectAll: "Select All",
  startSpeaking: "Start Speaking",
  stopSpeaking: "Stop Speaking",
  togglefullscreen: "Toggle Full Screen",
  windowMenu: "Window",
  minimize: "Minimize",
  zoom: "Zoom",
  front: "Bring All to Front",
  help: "Help",
  close: "Close Window",
};

export function localizeMenuRoles(
  template: readonly MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  return template.map((item) => {
    const roleLabel = item.role ? ROLE_LABELS[item.role] : undefined;
    return {
      ...item,
      ...(item.label === undefined && roleLabel ? { label: desktopT(roleLabel) } : {}),
      ...(Array.isArray(item.submenu) ? { submenu: localizeMenuRoles(item.submenu) } : {}),
    };
  });
}
