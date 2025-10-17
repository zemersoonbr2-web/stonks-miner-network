-- Update the handle_new_user function to process referral codes securely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_code_input TEXT;
  referrer_user_id UUID;
BEGIN
  -- Get referral code from metadata
  referral_code_input := NEW.raw_user_meta_data->>'referralCode';
  
  -- Insert profile first
  INSERT INTO public.profiles (id, nickname, phone, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    public.generate_referral_code()
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Process referral if code was provided
  IF referral_code_input IS NOT NULL AND referral_code_input != '' THEN
    -- Find referrer by code
    SELECT id INTO referrer_user_id
    FROM public.profiles
    WHERE referral_code = referral_code_input;
    
    -- Only proceed if referrer exists and is not self
    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      -- Update profile with referrer
      UPDATE public.profiles
      SET referred_by = referrer_user_id
      WHERE id = NEW.id;
      
      -- Create referral record
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referrer_user_id, NEW.id)
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;