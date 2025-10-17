-- Reset all active mining sessions for testing
DELETE FROM public.mining_sessions WHERE completed = false;

-- Reset all users mining status
UPDATE public.profiles SET is_mining = false;