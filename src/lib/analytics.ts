const GA_MEASUREMENT_ID = "G-53NN631J17";
const CONSENT_STORAGE_KEY = "familyloop:analytics-consent";

export type ConsentState = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredConsent(): ConsentState | null {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function persistConsent(consent: ConsentState) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, consent);
  } catch {
    // localStorage unavailable — the choice just won't persist across visits.
  }
}

let gaLoaded = false;

function loadGoogleAnalytics() {
  if (!isBrowser() || gaLoaded) return;
  gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  // We fire page_view manually (see trackEvent callers) since this is a
  // client-routed SPA — the automatic pageview tied to script load would
  // only ever fire once, for whichever route happened to be active then.
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

/** Called once at app start to restore a previously granted consent. */
export function initAnalyticsFromStoredConsent() {
  if (getStoredConsent() === "granted") loadGoogleAnalytics();
}

/** Called from the cookie banner when the user makes a choice. */
export function applyConsent(consent: ConsentState) {
  persistConsent(consent);
  if (consent === "granted") loadGoogleAnalytics();
}

/** Centralized event tracking — a no-op until the user has granted consent. */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (!isBrowser() || !gaLoaded || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
