import { decodeOptions, mFallback, t, type GTTranslationOptions } from "gt-react";

import { isI18nInitialized } from "./initializeI18n";

export function translateMessage(message: string, options: GTTranslationOptions = {}): string {
  // Build tools and pure helpers can run before the browser initializes GT.
  const resolve = isI18nInitialized() ? t : mFallback;
  const encodedOptions = decodeOptions(message);
  const source = encodedOptions?.$_source;
  return typeof source === "string"
    ? resolve(source, { ...encodedOptions, ...options })
    : resolve(message, options);
}
