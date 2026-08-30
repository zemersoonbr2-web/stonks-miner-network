import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins, Shield, Users, Zap, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/i18n/translations";
import stonksLogo from "@/assets/stonks-profile-logo.png";
import stonksCoinLogo from "@/assets/stonks-coin-logo.png";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  nickname: z.string().trim().min(3).max(12).regex(/^[a-zA-Z0-9_-]+$/),
  phone: z.string().regex(/^[0-9]{8,15}$/),
  phoneCode: z.string(),
  referralNickname: z.string().trim().min(3).max(12).regex(/^[a-zA-Z0-9_-]+$/).optional().or(z.literal(""))
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const Auth = () => {
  const navigate = useNavigate();
  const { t, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("pt");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    phone: "",
    phoneCode: "+55",
    referralNickname: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refNickname = urlParams.get('ref');
    if (refNickname) {
      setFormData(prev => ({ ...prev, referralNickname: refNickname }));
      setIsLogin(false);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const emailValidation = z.string().email().safeParse(formData.email);
        if (!emailValidation.success) {
          toast.error(t("invalidEmail"));
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) {
          toast.error(t("signupError"));
          setLoading(false);
          return;
        }
        toast.success(t("recoveryEmailSent"));
        setIsForgotPassword(false);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const validationResult = loginSchema.safeParse({
          email: formData.email,
          password: formData.password
        });
        if (!validationResult.success) {
          const error = validationResult.error.errors[0];
          if (error.path[0] === 'email') {
            toast.error(t("invalidEmail"));
          } else if (error.path[0] === 'password') {
            toast.error(t("passwordRequired"));
          }
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(t("invalidCredentials"));
          } else {
            toast.error(t("loginError"));
          }
          setLoading(false);
          return;
        }
        if (data.user) {
          toast.success(t("loginSuccess"));
          navigate("/dashboard");
        }
      } else {
        const validationResult = signupSchema.safeParse({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          phone: formData.phone,
          phoneCode: formData.phoneCode,
          referralNickname: formData.referralNickname || ""
        });
        if (!validationResult.success) {
          const error = validationResult.error.errors[0];
          const field = error.path[0];
          if (field === 'email') {
            toast.error(t("invalidEmail"));
          } else if (field === 'password') {
            if (error.code === 'too_small') {
              toast.error(t("passwordTooShort"));
            } else if (error.code === 'too_big') {
              toast.error(t("passwordTooLong"));
            } else {
              toast.error(t("passwordFormat"));
            }
          } else if (field === 'nickname') {
            if (error.code === 'too_small') {
              toast.error(t("nicknameMinLength"));
            } else if (error.code === 'too_big') {
              toast.error(t("nicknameMaxLength"));
            } else {
              toast.error(t("nicknameInvalidFormat"));
            }
          } else if (field === 'phone') {
            toast.error(t("invalidPhoneFormat"));
          } else if (field === 'referralNickname') {
            toast.error(t("invalidReferralNickname"));
          }
          setLoading(false);
          return;
        }
        const { data: existingNickname } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", formData.nickname)
          .maybeSingle();
        if (existingNickname) {
          toast.error(t("nicknameInUse"));
          setLoading(false);
          return;
        }
        if (formData.referralNickname) {
          const { data: referrer } = await supabase
            .from("profiles")
            .select("id")
            .eq("nickname", formData.referralNickname)
            .maybeSingle();
          if (!referrer) {
            toast.error(t("referralNotFound"));
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
              phone: formData.phoneCode + formData.phone,
              referralNickname: formData.referralNickname || null,
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
            toast.error(t("emailAlreadyExists"));
          } else {
            toast.error(t("signupError"));
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
      toast.error(t("signupError"));
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Zap, title: "Mineracao diaria", desc: "1 clique por dia para minerar STKN" },
    { icon: Users, title: "Rede de referencias", desc: "Ganhe 10% dos indicados" },
    { icon: Shield, title: "Seguranca total", desc: "Sistema anti-fraude e KYC" },
    { icon: Coins, title: "Tokens valiosos", desc: "STKN com potencial real" },
  ];

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[120px]" />
      </div>

      {/* Left panel - branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 border-r border-border/30">
        <div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao inicio
          </button>

          <div className="flex items-center gap-3 mb-8">
            <img src={stonksCoinLogo} alt="STKN" className="w-10 h-10 rounded-full" />
            <span className="text-2xl font-bold text-gradient-primary">Stonks Network</span>
          </div>

          <h2 className="text-3xl font-bold mb-3 text-foreground">A mineracao digital
            <br /><span className="text-gradient-gold">mais simples do mundo.</span>
          </h2>
          <p className="text-muted-foreground mb-12 max-w-md">
            Crie sua conta em segundos e comece a construir seu patrimonio digital hoje.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-5 border-border/40">
                <item.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Stonks Network</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile back button */}
          <button
            onClick={() => navigate("/")}
            className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <Card className="glass-card p-8 border-border/40">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4 lg:hidden">
                <img src={stonksLogo} alt="Stonks Network" className="h-20 w-20 rounded-full object-cover shadow-lg ring-2 ring-primary/30" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isForgotPassword
                  ? t("recoverPassword")
                  : isLogin
                    ? t("enterAccount")
                    : t("createAccount")
                }
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isForgotPassword
                  ? "Informe seu email para recuperar o acesso"
                  : isLogin
                    ? "Entre com suas credenciais para acessar"
                    : "Preencha os dados abaixo para comecar"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isForgotPassword && (
                <>
                  <div>
                    <Label htmlFor="language" className="text-xs uppercase tracking-wider text-muted-foreground">{t("selectLanguage")}</Label>
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
                          className={`flex flex-col items-center py-5 ${
                            selectedLanguage === lang.code
                              ? "bg-gradient-primary border-primary"
                              : "border-border/50 hover:border-primary/50"
                          }`}
                          onClick={() => {
                            setSelectedLanguage(lang.code as Language);
                            setLanguage(lang.code as Language);
                          }}
                        >
                          <span className="text-2xl mb-0.5">{lang.flag}</span>
                          <span className="text-xs font-semibold">{lang.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nickname" className="text-xs uppercase tracking-wider text-muted-foreground">{t("nickname")}</Label>
                    <Input
                      id="nickname"
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      required={!isLogin}
                      className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                      placeholder="seu_nickname"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">{t("phone")}</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Select
                        value={formData.phoneCode}
                        onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
                      >
                        <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                          <SelectValue placeholder="+55" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="+55">🇧🇷 +55</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+351">🇵🇹 +351</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                          <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          <SelectItem value="+56">🇨🇱 +56</SelectItem>
                          <SelectItem value="+57">🇨🇴 +57</SelectItem>
                          <SelectItem value="+58">🇻🇪 +58</SelectItem>
                          <SelectItem value="+51">🇵🇪 +51</SelectItem>
                          <SelectItem value="+593">🇪🇨 +593</SelectItem>
                          <SelectItem value="+591">🇧🇴 +591</SelectItem>
                          <SelectItem value="+595">🇵🇾 +595</SelectItem>
                          <SelectItem value="+598">🇺🇾 +598</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                          <SelectItem value="+39">🇮🇹 +39</SelectItem>
                          <SelectItem value="+81">🇯🇵 +81</SelectItem>
                          <SelectItem value="+82">🇰🇷 +82</SelectItem>
                          <SelectItem value="+86">🇨🇳 +86</SelectItem>
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="11999999999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                        required={!isLogin}
                        className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                  placeholder="seu@email.com"
                />
              </div>

              {!isForgotPassword && (
                <div>
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {!isLogin && !isForgotPassword && (
                <div>
                  <Label htmlFor="referralNickname" className="text-xs uppercase tracking-wider text-muted-foreground">{t("referralNickname")}</Label>
                  <Input
                    id="referralNickname"
                    type="text"
                    placeholder={t("referralNicknamePlaceholder")}
                    value={formData.referralNickname}
                    onChange={(e) => setFormData({ ...formData, referralNickname: e.target.value })}
                    className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t("referralNicknameHint")}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 py-5 text-sm font-semibold mt-2"
                disabled={loading}
              >
                {loading
                  ? t("processing")
                  : isForgotPassword
                    ? t("sendRecoveryEmail")
                    : isLogin
                      ? t("login")
                      : t("signup")
                }
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {!isForgotPassword && isLogin && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block w-full"
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
