-- Add unique constraint on (user_id, name) for sources table to support ON CONFLICT upserts
ALTER TABLE public.sources ADD CONSTRAINT sources_user_id_name_unique UNIQUE (user_id, name);

-- Also add unique constraint on (user_id, url) for articles deduplication
ALTER TABLE public.articles ADD CONSTRAINT articles_user_id_url_unique UNIQUE (user_id, url);

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sources_updated_at') THEN
    CREATE TRIGGER update_sources_updated_at
      BEFORE UPDATE ON public.sources
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
