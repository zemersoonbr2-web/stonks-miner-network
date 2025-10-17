-- Reset last mining time for all users to allow immediate mining
UPDATE public.profiles
SET last_mining_at = NOW() - INTERVAL '25 hours'
WHERE last_mining_at IS NOT NULL;