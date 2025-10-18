-- Add language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es'));