/** UI locale mirror of the selected language (set by the I18n provider). */
let uiLocale = "es-CO";

export function setUiLocale(locale: string) {
  uiLocale = locale;
}

export function getUiLocale(): string {
  return uiLocale;
}
