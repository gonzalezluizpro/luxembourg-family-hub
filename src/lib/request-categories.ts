// Mirrors the `category` CHECK constraint on the (manually created) remote
// public.requests table. Distinct from activity-categories.ts — mutual-aid
// requests aren't shaped like activities.
export const REQUEST_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "pickup", label: "Buscar/levar crianças" },
  { id: "ride", label: "Carona / transporte" },
  { id: "lend", label: "Empréstimo de material" },
  { id: "childcare", label: "Cuidado infantil / babysitting" },
  { id: "info", label: "Informação / orientação" },
  { id: "other", label: "Outro" },
];
