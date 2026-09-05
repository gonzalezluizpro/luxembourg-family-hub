CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('sport', 'music', 'art', 'nature', 'scouts', 'culture', 'swimming', 'playground', 'event', 'community')),
  age_min int CHECK (age_min >= 0),
  age_max int CHECK (age_max >= 0),
  city text,
  latitude float,
  longitude float,
  entry_type text NOT NULL CHECK (entry_type IN ('open', 'registration_required', 'contact_required', 'members_only')),
  price_info text,
  languages text[],
  is_recurring boolean DEFAULT false,
  schedule_info text,
  source_url text,
  source_name text,
  created_at timestamp with time zone DEFAULT now()
);

GRANT ALL ON public.activities TO anon;
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all anon access on activities"
ON public.activities
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all authenticated access on activities"
ON public.activities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

GRANT ALL ON public.interest TO anon;
GRANT ALL ON public.interest TO authenticated;
GRANT ALL ON public.interest TO service_role;

ALTER TABLE public.interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all anon access on interest"
ON public.interest
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all authenticated access on interest"
ON public.interest
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
