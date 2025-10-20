-- Update handle_new_user function to give 0.05 STKN bonus to both referrer and referred
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  referral_code_input TEXT;
  referrer_user_id UUID;
  user_language TEXT;
BEGIN
  -- Get referral code and language from metadata
  referral_code_input := NEW.raw_user_meta_data->>'referralCode';
  user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt');
  
  -- Insert profile first
  INSERT INTO public.profiles (id, nickname, phone, referral_code, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    public.generate_referral_code(),
    user_language
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
      
      -- Give 0.05 STKN bonus to the new user (referred)
      UPDATE public.profiles
      SET balance = balance + 0.05,
          total_mined = total_mined + 0.05
      WHERE id = NEW.id;
      
      -- Give 0.05 STKN bonus to the referrer
      UPDATE public.profiles
      SET balance = balance + 0.05,
          total_mined = total_mined + 0.05
      WHERE id = referrer_user_id;
      
      -- Create transaction records for both
      INSERT INTO public.transactions (user_id, type, amount, description)
      VALUES 
        (NEW.id, 'bonus', 0.05, 'Bônus de boas-vindas por indicação'),
        (referrer_user_id, 'bonus', 0.05, 'Bônus por indicar novo usuário');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;