/*
# Guarantee company links on tables that policies depend on

Runs immediately after the base schema. The base schema already defines these columns,
so this is a no-op on a fresh database; it protects against any older table definition.
*/

ALTER TABLE public.medicals ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.travel_health ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.sickness_absence_cases ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;