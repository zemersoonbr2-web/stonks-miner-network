-- Tornar o nickname único e ajustar validações
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_nickname_unique UNIQUE (nickname);

-- Adicionar constraint para garantir que nickname não tenha espaços
ALTER TABLE public.profiles
ADD CONSTRAINT nickname_no_spaces CHECK (nickname !~ '\s');

-- Adicionar constraint para limitar tamanho do nickname
ALTER TABLE public.profiles
ADD CONSTRAINT nickname_length CHECK (char_length(nickname) <= 12 AND char_length(nickname) >= 3);