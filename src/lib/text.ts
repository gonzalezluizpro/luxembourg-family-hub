const DIACRITICS_RANGE = String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f);
const DIACRITICS_REGEX = new RegExp(`[${DIACRITICS_RANGE}]`, "g");

export function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "");
}
