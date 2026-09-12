import { useEffect, useState } from "react";
import { applyConsent, getStoredConsent, initAnalyticsFromStoredConsent } from "@/lib/analytics";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initAnalyticsFromStoredConsent();
    if (getStoredConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] border-t border-border bg-card px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Usamos analytics para entender como o site é usado e melhorar sua experiência. Sem cookies
          — guardamos apenas um identificador anónimo no seu navegador.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              applyConsent("denied");
              setVisible(false);
            }}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => {
              applyConsent("granted");
              setVisible(false);
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
