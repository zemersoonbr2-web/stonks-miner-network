import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(72, "Senha muito longa")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter letras maiúsculas, minúsculas e números"),
  nickname: z.string()
    .trim()
    .min(3, "Apelido deve ter no mínimo 3 caracteres")
    .max(20, "Apelido muito longo")
    .regex(/^[a-zA-Z0-9_-]+$/, "Apelido deve conter apenas letras, números, _ ou -"),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Formato de telefone inválido (use +55...)"),
  referralCode: z.string()
    .regex(/^STK[A-Z0-9]{8}$/, "Código de convite inválido")
    .optional()
    .or(z.literal(""))
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória")
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    phone: "",
    referralCode: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Validate email
        const emailValidation = z.string().email("Email inválido").safeParse(formData.email);
        
        if (!emailValidation.success) {
          toast.error(emailValidation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/dashboard`
        });

        if (error) {
          toast.error("Erro ao enviar email de recuperação");
          setLoading(false);
          return;
        }

        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setIsForgotPassword(false);
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Validate login data
        const validationResult = loginSchema.safeParse({
          email: formData.email,
          password: formData.password
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error("Erro ao fazer login");
          }
          setLoading(false);
          return;
        }
        
        if (data.user) {
          toast.success("Login realizado com sucesso!");
          navigate("/dashboard");
        }
      } else {
        // Validate signup data
        const validationResult = signupSchema.safeParse({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          phone: formData.phone,
          referralCode: formData.referralCode || ""
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        // Check if referral code exists (if provided)
        if (formData.referralCode) {
          const { data: referrer } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", formData.referralCode)
            .maybeSingle();

          if (!referrer) {
            toast.error("Código de convite inválido");
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nickname: formData.nickname,
              phone: formData.phone,
              referralCode: formData.referralCode || null
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error("Erro ao criar conta");
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          toast.success("Conta criada! Você já pode fazer login.");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <Coins className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Stonks Network
          </h1>
          <p className="text-muted-foreground mt-2">
            {isForgotPassword 
              ? "Recuperar senha" 
              : isLogin 
                ? "Entre na sua conta" 
                : "Crie sua conta"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <>
              <div>
                <Label htmlFor="nickname">Apelido</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  required={!isLogin}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {!isForgotPassword && (
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div>
              <Label htmlFor="referralCode">Código de Convite (opcional)</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="STK12345678"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={loading}
          >
            {loading 
              ? "Processando..." 
              : isForgotPassword 
                ? "Enviar Email de Recuperação" 
                : isLogin 
                  ? "Entrar" 
                  : "Criar Conta"
            }
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {!isForgotPassword && isLogin && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-primary hover:underline block w-full"
            >
              Esqueceu a senha?
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setIsForgotPassword(false);
            }}
            className="text-sm text-primary hover:underline"
          >
            {isForgotPassword 
              ? "Voltar ao login" 
              : isLogin 
                ? "Não tem conta? Cadastre-se" 
                : "Já tem conta? Entre"
            }
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;