-- Criar tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para visualizar mensagens (onde você é remetente ou destinatário)
CREATE POLICY "Users can view their own messages"
ON public.chat_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Política para inserir mensagens
CREATE POLICY "Users can send messages to friends"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE (referrer_id = auth.uid() AND referred_id = receiver_id)
       OR (referrer_id = receiver_id AND referred_id = auth.uid())
  )
);

-- Criar índices para performance
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON public.chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Função para manter apenas 10 mensagens por conversa
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg_count INTEGER;
BEGIN
  -- Contar mensagens entre os dois usuários
  SELECT COUNT(*) INTO msg_count
  FROM public.chat_messages
  WHERE (sender_id = NEW.sender_id AND receiver_id = NEW.receiver_id)
     OR (sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id);
  
  -- Se passar de 10, deletar as mais antigas
  IF msg_count > 10 THEN
    DELETE FROM public.chat_messages
    WHERE id IN (
      SELECT id FROM public.chat_messages
      WHERE (sender_id = NEW.sender_id AND receiver_id = NEW.receiver_id)
         OR (sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id)
      ORDER BY created_at ASC
      LIMIT (msg_count - 10)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para limpar mensagens antigas
CREATE TRIGGER cleanup_old_messages_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_messages();

-- Habilitar realtime para chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;