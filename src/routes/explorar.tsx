import { createFileRoute, redirect } from "@tanstack/react-router";
import { homeSearchSchema } from "@/routes/index";

// /explorar was folded into / (see routes/index.tsx) when the intermediate
// landing page was removed. This keeps old links/bookmarks working.
export const Route = createFileRoute("/explorar")({
  validateSearch: homeSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search });
  },
});
