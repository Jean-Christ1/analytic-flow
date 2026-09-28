ALTER TABLE public.feature_flag
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS flag_type text NOT NULL DEFAULT 'boolean',
  ADD COLUMN IF NOT EXISTS default_value jsonb NOT NULL DEFAULT 'false'::jsonb,
  ADD COLUMN IF NOT EXISTS rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

UPDATE public.feature_flag SET name = key WHERE name IS NULL;
