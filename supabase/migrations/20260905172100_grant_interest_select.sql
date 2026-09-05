-- The previous migration granted anon/authenticated INSERT-only access to
-- `interest` (so people can register interest without an account), but the
-- "X famílias interessadas" counter on activity cards/detail pages needs to
-- read that same table to compute a COUNT per activity_id.
GRANT SELECT ON public.interest TO anon, authenticated;

CREATE POLICY "Interest counts are publicly readable"
ON public.interest
FOR SELECT
TO anon, authenticated
USING (true);
