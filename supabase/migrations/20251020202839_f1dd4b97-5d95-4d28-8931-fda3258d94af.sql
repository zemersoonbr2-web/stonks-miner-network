-- Criar função para limpar mining_sessions antigas (completadas há mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_mining_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mining_sessions
  WHERE completed = true
    AND ends_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Criar função para limpar reminders antigos (enviados há mais de 7 dias)
CREATE OR REPLACE FUNCTION cleanup_old_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.reminders
  WHERE sent_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Criar função para limpar transactions muito antigas (mais de 90 dias)
-- Mantém apenas o resumo necessário no perfil (balance e total_mined)
CREATE OR REPLACE FUNCTION cleanup_old_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.transactions
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Criar extensão pg_cron se não existir (para executar limpezas automaticamente)
-- Nota: Esta extensão precisa ser habilitada pelo administrador do Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar limpeza automática diária às 2h da manhã
SELECT cron.schedule(
  'cleanup-mining-sessions',
  '0 2 * * *', -- Todo dia às 2h
  'SELECT cleanup_old_mining_sessions();'
);

SELECT cron.schedule(
  'cleanup-reminders',
  '0 2 * * *', -- Todo dia às 2h
  'SELECT cleanup_old_reminders();'
);

SELECT cron.schedule(
  'cleanup-transactions',
  '0 3 * * *', -- Todo dia às 3h (após mining_sessions)
  'SELECT cleanup_old_transactions();'
);

-- Criar índices para melhorar performance das queries de limpeza
CREATE INDEX IF NOT EXISTS idx_mining_sessions_cleanup 
  ON public.mining_sessions(completed, ends_at) 
  WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_reminders_cleanup 
  ON public.reminders(sent_at);

CREATE INDEX IF NOT EXISTS idx_transactions_cleanup 
  ON public.transactions(created_at);

-- Criar índices para melhorar performance geral com muitos usuários
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code 
  ON public.profiles(referral_code);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
  ON public.referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation 
  ON public.chat_messages(sender_id, receiver_id, created_at);