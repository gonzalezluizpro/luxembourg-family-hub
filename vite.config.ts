// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// The lovable config's "VITE_* env injection" only inlines vars whose *actual* name starts
// with VITE_ into import.meta.env for the client bundle — that's Vite's own security default,
// not something configurable via envPrefix here. Vercel has SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY
// set without that prefix, so they're readable via process.env during SSR/build but never reach
// import.meta.env in the browser bundle, which is why src/integrations/supabase/client.ts throws
// "Missing Supabase environment variable(s)" only in production (locally, .env.local already
// defines VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY directly).
// Bridge them here, but only when the VITE_-prefixed name isn't already set, so this never
// overrides a correctly configured value (e.g. once Vercel gets its own VITE_ vars, this becomes a no-op).
const envBridge: Record<string, string> = {};
if (!process.env["VITE_SUPABASE_URL"] && process.env["SUPABASE_URL"]) {
  envBridge["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(process.env["SUPABASE_URL"]);
}
if (!process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] && process.env["SUPABASE_PUBLISHABLE_KEY"]) {
  envBridge["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(
    process.env["SUPABASE_PUBLISHABLE_KEY"],
  );
}
// PostHog project API key, same no-VITE_-prefix convention. Unlike the Supabase
// vars above it has no VITE_-prefixed twin anywhere, so read it straight through:
// process.env covers Vercel (real env var), and loadEnv with an empty prefix covers
// local dev/build, where POSTHOG_API_KEY lives in .env.local and Vite would
// otherwise never load a non-VITE_ name. Only this one key is lifted out of the
// dotenv result — nothing else from .env.local reaches the client bundle.
const dotenv = loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), "");
const posthogApiKey = process.env["POSTHOG_API_KEY"] || dotenv["POSTHOG_API_KEY"];
if (posthogApiKey) {
  envBridge["import.meta.env.POSTHOG_API_KEY"] = JSON.stringify(posthogApiKey);
}

export default defineConfig({
  vite: { define: envBridge },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
