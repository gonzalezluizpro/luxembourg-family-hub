DROP POLICY IF EXISTS "Allow all anon access on activities" ON public.activities;
DROP POLICY IF EXISTS "Allow all authenticated access on activities" ON public.activities;
DROP POLICY IF EXISTS "Allow all anon access on interest" ON public.interest;
DROP POLICY IF EXISTS "Allow all authenticated access on interest" ON public.interest;

REVOKE ALL ON public.activities FROM anon, authenticated;
REVOKE ALL ON public.interest FROM anon, authenticated;

GRANT SELECT ON public.activities TO anon, authenticated;
GRANT ALL ON public.activities TO service_role;
GRANT INSERT ON public.interest TO anon, authenticated;
GRANT ALL ON public.interest TO service_role;

CREATE POLICY "Activities are publicly readable" ON public.activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can register interest" ON public.interest FOR INSERT TO anon, authenticated WITH CHECK (true);