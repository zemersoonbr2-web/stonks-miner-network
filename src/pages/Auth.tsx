import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/i18n/translations";
import stonksLogo from "@/assets/stonks-profile-logo.png";

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
    // Check for referral nickname in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refNickname = urlParams.get('ref');
    
    if (refNickname) {
      setFormData(prev => ({ ...prev, referralNickname: refNickname }));
      setIsLogin(false); // Switch to signup mode
    }

    // Listen for auth state changes
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
        // Validate email
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
        // Validate login data
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
        // Validate signup data
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

        // Check if nickname is already taken
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

        // Check if referral nickname exists (if provided)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={stonksLogo} alt="Stonks Network" className="h-24 w-24 rounded-full object-cover shadow-lg ring-2 ring-primary/30" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {t("stonksNetwork")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isForgotPassword 
              ? t("recoverPassword")
              : isLogin 
                ? t("enterAccount")
                : t("createAccount")
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
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
                      onClick={() => {
                        setSelectedLanguage(lang.code as Language);
                        setLanguage(lang.code as Language);
                      }}
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
                <div className="flex gap-2">
                  <Select
                    value={formData.phoneCode}
                    onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="+55" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
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
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          )}

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
              <Label htmlFor="referralNickname">{t("referralNickname")}</Label>
              <Input
                id="referralNickname"
                type="text"
                placeholder={t("referralNicknamePlaceholder")}
                value={formData.referralNickname}
                onChange={(e) => setFormData({ ...formData, referralNickname: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("referralNicknameHint")}
              </p>
            </div>
          )}

          <Button
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
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
      </Card>
    </div>
  );
};

export default Auth;