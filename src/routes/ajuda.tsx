import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { WHATSAPP_GROUP_URL } from "@/lib/constants";
import { REQUEST_CATEGORIES } from "@/lib/request-categories";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda mútua — FamilyLoop Luxembourg" },
      {
        name: "description",
        content: "Peça ajuda ou ofereça ajuda a outras famílias em Luxemburgo.",
      },
    ],
  }),
  component: Ajuda,
});

type RequestType = "need" | "offer";

// Mirrors the CHECK constraint on public.requests.contact_email — kept loose
// (matches the DB's intent, not a full RFC 5322 validator).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_MESSAGE = "Já publicaste 3 pedidos hoje. Tenta amanhã.";

// The DB's rate limit (3 requests per contact_email per 24h) is enforced via
// a CHECK constraint that raises Postgres code 23514 (check_violation) with
// the message "Limite de 3 pedidos por dia atingido." — but 23514 is also
// the code for every other CHECK on this table (description length, the
// email/phone-required rule, etc.), so the code alone is ambiguous. Require
// both the code and the message substring; never match on code alone.
function isRateLimitError(error: { code?: string; message: string }) {
  return error.code === "23514" && error.message.includes("Limite de 3 pedidos");
}

function Ajuda() {
  const [type, setType] = useState<RequestType>("need");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("");
  const [whenNeeded, setWhenNeeded] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trimmedDescription = description.trim();
  const trimmedCommune = commune.trim();
  const trimmedName = contactName.trim();
  const trimmedEmail = contactEmail.trim();
  const trimmedPhone = contactPhone.trim();

  const hasContact = trimmedEmail !== "" || trimmedPhone !== "";
  const emailValid = trimmedEmail === "" || EMAIL_REGEX.test(trimmedEmail);

  const canSubmit =
    category !== "" &&
    trimmedDescription.length >= 10 &&
    trimmedDescription.length <= 500 &&
    trimmedCommune.length >= 2 &&
    trimmedCommune.length <= 60 &&
    whenNeeded.trim().length <= 120 &&
    trimmedName.length >= 2 &&
    trimmedName.length <= 80 &&
    trimmedPhone.length <= 30 &&
    hasContact &&
    emailValid;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("requests").insert({
      type,
      category,
      description: trimmedDescription,
      commune: trimmedCommune,
      when_needed: whenNeeded.trim() || null,
      contact_name: trimmedName,
      contact_email: trimmedEmail || null,
      contact_phone: trimmedPhone || null,
    });
    setSubmitting(false);
    if (error) {
      if (isRateLimitError(error)) {
        toast.error(RATE_LIMIT_MESSAGE);
      } else {
        toast.error("Não foi possível enviar seu pedido. Tente de novo.");
      }
      return;
    }
    trackEvent("request_submitted", { type, category });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Obrigado! 🎉</h1>
        <p className="text-sm text-muted-foreground">
          {type === "need"
            ? "Seu pedido de ajuda foi enviado. Assim que outra família puder ajudar, ela vai entrar em contato."
            : "Sua oferta de ajuda foi registrada. Obrigado por apoiar outras famílias!"}
        </p>
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Entrar no grupo do WhatsApp
        </a>
        <Link to="/" className="text-sm text-muted-foreground underline hover:text-foreground">
          Voltar para as atividades
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-foreground">Ajuda mútua entre famílias</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sem cadastro — só precisamos do seu nome e de pelo menos um contacto (e-mail ou telemóvel)
        para outra família falar com você.
      </p>

      <Tabs value={type} onValueChange={(v) => setType(v as RequestType)} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="need">PRECISO</TabsTrigger>
          <TabsTrigger value="offer">POSSO AJUDAR</TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Escolha uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">
            {type === "need" ? "O que você precisa?" : "Como você pode ajudar?"}
          </Label>
          <Textarea
            id="description"
            required
            minLength={10}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva em poucas palavras (mínimo 10 caracteres)"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="commune">Comuna</Label>
          <Input
            id="commune"
            required
            minLength={2}
            maxLength={60}
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            placeholder="Ex: Luxembourg, Esch-sur-Alzette"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="when">Quando</Label>
          <Input
            id="when"
            maxLength={120}
            value={whenNeeded}
            onChange={(e) => setWhenNeeded(e.target.value)}
            placeholder="Ex: esta semana, urgente, flexível"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Nome</Label>
          <Input
            id="contact-name"
            required
            minLength={2}
            maxLength={80}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-email">E-mail</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          {!emailValid && (
            <p className="text-xs text-destructive">Digite um e-mail válido.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Telemóvel</Label>
          <Input
            id="contact-phone"
            type="tel"
            maxLength={30}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>

        {!hasContact && (
          <p className="text-xs text-muted-foreground">
            Preencha pelo menos um contacto: e-mail ou telemóvel.
          </p>
        )}

        <Button type="submit" disabled={!canSubmit || submitting} className="w-full">
          {submitting ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </main>
  );
}
