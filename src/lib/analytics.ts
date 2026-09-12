import posthog from "posthog-js";

// Same access pattern as src/integrations/supabase/client.ts: the key is set as
// POSTHOG_API_KEY (no VITE_ prefix) both in .env.local and on Vercel, so it only
// reaches the client bundle through the vite.config.ts define bridge;
// process.env covers SSR/build. Missing key => every export below is a no-op,
// so a deploy without the var degrades silently instead of breaking the app.
const POSTHOG_API_KEY = resolveKey();

const POSTHOG_API_HOST = "https://eu.posthog.com";

// Bumped from the GA-era key on purpose: consent granted for Google Analytics
// doesn't carry over to a different processor, so returning visitors are asked
// once more. Drop the ":v2" suffix if you'd rather keep the old grants.
const CONSENT_STORAGE_KEY = "familyloop:analytics-consent:v2";

export type ConsentState = "granted" | "denied";

function resolveKey(): string {
  const injected = import.meta.env["POSTHOG_API_KEY"];
  if (typeof injected === "string" && injected !== "") return injected;
  if (typeof process !== "undefined") {
    const fromNode = process.env?.["POSTHOG_API_KEY"];
    if (typeof fromNode === "string" && fromNode !== "") return fromNode;
  }
  return "";
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

let posthogLoaded = false;

function loadPostHog() {
  if (!isBrowser() || posthogLoaded || POSTHOG_API_KEY === "") return;
  posthogLoaded = true;

  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_API_HOST,
    // Pinned so a posthog-js upgrade can't silently turn new capture
    // behaviour on; bump deliberately after reading their changelog.
    defaults: "2025-05-24",
    // No cookies — the distinct_id lives in localStorage. Still device
    // storage under ePrivacy, which is why init only runs after consent.
    persistence: "localStorage",
    // Parity with the GA setup: only the events trackEvent() sends
    // explicitly, nothing scraped from clicks or replayed sessions.
    autocapture: false,
    disable_session_recording: true,
    // The GA build had to fire page_view by hand because gtag's automatic
    // pageview fires once per script load, which is wrong in a client-routed
    // SPA. PostHog handles that natively by listening to history changes, so
    // $pageview stays correct across route transitions. The explicit
    // trackEvent("page_view") call in src/routes/index.tsx is untouched and
    // still arrives as its own custom event.
    capture_pageview: "history_change",
    capture_pageleave: true,
  });
}

/** Called once at app start to restore a previously granted consent. */
export function initAnalyticsFromStoredConsent() {
  if (getStoredConsent() === "granted") loadPostHog();
}

/** Called from the consent banner when the user makes a choice. */
export function applyConsent(consent: ConsentState) {
  persistConsent(consent);
  if (consent === "granted") loadPostHog();
}

/** Centralized event tracking — a no-op until the user has granted consent. */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (!isBrowser() || !posthogLoaded) return;
  posthog.capture(eventName, params);
}
