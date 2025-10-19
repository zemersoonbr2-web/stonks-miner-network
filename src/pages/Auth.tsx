import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/i18n/translations";

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
  const { t, setLanguage, language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("pt");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    phone: "",
    referralCode: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    // Check if user is coming from password reset email by checking URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      // User clicked password reset link
      setIsResetPassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResetPassword(true);
        setIsLogin(false);
        setIsForgotPassword(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        // Validate new password
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("As senhas não coincidem");
          setLoading(false);
          return;
        }

        const passwordValidation = z.string()
          .min(8, "Senha deve ter no mínimo 8 caracteres")
          .max(72, "Senha muito longa")
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter letras maiúsculas, minúsculas e números")
          .safeParse(formData.newPassword);

        if (!passwordValidation.success) {
          toast.error(passwordValidation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (error) {
          toast.error("Erro ao atualizar senha");
          setLoading(false);
          return;
        }

        toast.success("Senha atualizada com sucesso!");
        setIsResetPassword(false);
        navigate("/dashboard");
        return;
      }

      if (isForgotPassword) {
        // Validate email
        const emailValidation = z.string().email("Email inválido").safeParse(formData.email);
        
        if (!emailValidation.success) {
          toast.error(emailValidation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`
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
              referralCode: formData.referralCode || null,
              language: selectedLanguage
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (data.user) {
          setLanguage(selectedLanguage);
        }

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
          toast.success(t("accountCreated"));
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
            {t("stonksNetwork")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isResetPassword
              ? "Defina sua nova senha"
              : isForgotPassword 
                ? t("recoverPassword")
                : isLogin 
                  ? t("enterAccount")
                  : t("createAccount")
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isResetPassword ? (
            <>
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </>
          ) : null}

          {!isLogin && !isForgotPassword && !isResetPassword && (
            <>
              <div>
                <Label htmlFor="language">{t("selectLanguage")}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { code: "pt", flag: "🇧🇷", name: "PT" },
                    { code: "en", flag: "🇺🇸", name: "EN" },
                    { code: "es", flag: "🇪🇸", name: "ES" },
                  ].map((lang) => (
                    <Button
                      key={lang.code}
                      type="button"
                      variant={selectedLanguage === lang.code ? "default" : "outline"}
                      className={`flex flex-col items-center py-6 ${
                        selectedLanguage === lang.code 
                          ? "bg-gradient-primary border-primary" 
                          : "border-primary/30 hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedLanguage(lang.code as Language)}
                    >
                      <span className="text-3xl mb-1">{lang.flag}</span>
                      <span className="text-xs font-semibold">{lang.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="nickname">{t("nickname")}</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  required={!isLogin}
                />
              </div>

              <div>
                <Label htmlFor="phone">{t("phone")}</Label>
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

          {!isResetPassword && (
            <>
              <div>
                <Label htmlFor="email">{t("email")}</Label>
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
              <Label htmlFor="password">{t("password")}</Label>
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
              <Label htmlFor="referralCode">{t("referralCode")}</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="STK12345678"
                value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                />
              </div>
              )}
            </>
          )}

          <Button
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={loading}
          >
            {loading 
              ? t("processing")
              : isResetPassword
                ? "Atualizar Senha"
                : isForgotPassword 
                  ? t("sendRecoveryEmail")
                  : isLogin 
                    ? t("login")
                    : t("signup")
            }
          </Button>
        </form>

        {!isResetPassword && (
          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && isLogin && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-primary hover:underline block w-full"
            >
                {t("forgotPassword")}
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
                  ? t("backToLogin")
                  : isLogin 
                    ? t("noAccount")
                    : t("hasAccount")
                }
              </button>
            </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;