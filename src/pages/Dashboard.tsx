import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Users, Clock, TrendingUp, Shield, Award, Target, Trophy } from "lucide-react";
import stonksLogo from "@/assets/stonks-coin-logo.png";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AdDialog } from "@/components/AdDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MobileMenu } from "@/components/MobileMenu";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [miningSession, setMiningSession] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [earnedSoFar, setEarnedSoFar] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!miningSession) return;
    
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [miningSession]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);
        
        // Count total users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true });
        
        setTotalUsers(userCount || 0);
        
        // Count referrals
        const { count } = await supabase
          .from("referrals")
          .select("*", { count: 'exact', head: true })
          .eq("referrer_id", user.id);
        
        setReferralCount(count || 0);
        
        if (profileData.is_mining) {
          const { data: sessionData } = await supabase
            .from("mining_sessions")
            .select("*")
            .eq("user_id", user.id)
            .eq("completed", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (sessionData) {
            setMiningSession(sessionData);
          }
        }
      }
    } catch (error) {
      // Error silently handled - user will be redirected by auth guard
    } finally {
      setLoading(false);
    }
  };

  const updateTimer = () => {
    if (!miningSession || isCompleting) return;
    
    const now = new Date().getTime();
    const start = new Date(miningSession.started_at).getTime();
    const end = new Date(miningSession.ends_at).getTime();
    const totalDuration = end - start;
    const elapsed = now - start;
    const diff = end - now;

    if (diff <= 0 && !isCompleting) {
      setTimeRemaining("00:00:00");
      setCurrentProgress(100);
      setEarnedSoFar(0.05);
      setIsCompleting(true);
      completeMining();
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      // Calcular progresso e tokens ganhos até agora
      const progressPercent = (elapsed / totalDuration) * 100;
      const earned = (elapsed / totalDuration) * 0.05;
      
      setCurrentProgress(Math.min(progressPercent, 100));
      setEarnedSoFar(earned);
    }
  };

  const completeMining = async () => {
    if (!miningSession || isCompleting) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-mining`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: miningSession.id })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Invalid or completed session') {
          // Sessão já foi completada, apenas recarrega o perfil silenciosamente
          setIsCompleting(false);
          loadProfile();
          return;
        }
        toast.error(result.error || "Erro ao completar mineração");
        setIsCompleting(false);
        return;
      }

      toast.success(`Mineração concluída! Você ganhou ${result.reward} STK`);
      setIsCompleting(false);
      loadProfile();
    } catch (error) {
      toast.error("Erro ao completar mineração");
      setIsCompleting(false);
    }
  };

  const handleStartMining = () => {
    setShowAdDialog(true);
  };

  const startMining = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-mining`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erro ao iniciar mineração");
        return;
      }

      toast.success("Mineração iniciada!");
      loadProfile();
    } catch (error) {
      toast.error("Erro ao iniciar mineração");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        <header className="mb-8 sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 -mx-4 px-4 py-4">
          <div className="flex items-center justify-between">
            <MobileMenu isAdmin={isAdmin} nickname={profile?.nickname} />
            
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2">
                <img src={stonksLogo} alt="STK" className="w-6 h-6" />
                <span className="text-2xl md:text-3xl font-bold text-gradient-gold">
                  {(parseFloat(profile?.balance || 0) + earnedSoFar).toFixed(5)}
                </span>
              </div>
            </div>
            
            <LanguageSelector />
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="glass-card p-6 hover-glow border-primary/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-glow-strong flex-shrink-0 ring-2 ring-primary/50">
                <img src={stonksLogo} alt="Stonks Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t("totalBalance")}</p>
                <p className="text-2xl font-bold text-gradient-gold text-glow">
                  {(parseFloat(profile?.balance || 0) + earnedSoFar).toFixed(8)}
                </p>
                <p className="text-xs text-muted-foreground">STK</p>
                {profile?.is_mining && earnedSoFar > 0 && (
                  <p className="text-xs text-success mt-1 text-glow">+{earnedSoFar.toFixed(8)} {t("mining").toLowerCase()}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 hover-glow border-secondary/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-glow">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t("references")}</p>
                <p className="text-3xl font-bold text-gradient-cyber text-glow">{referralCount}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 hover-glow border-accent/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 shadow-glow">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t("miningStatus")}</p>
                <p className="text-xl font-bold text-gradient-cyber text-glow">
                  {profile?.is_mining ? t("active") : t("inactive")}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Card de Mineração */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card className="glass-card p-8 hover-glow border-primary/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
            <div className="text-center relative z-10">
              <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6 shadow-glow-strong">
                <Coins className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-gradient-primary text-glow tracking-tight">
                {t("mining24h")}
              </h2>
              {profile?.is_mining ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider">{t("inProgress")}</p>
                  <div className="text-6xl font-bold text-gradient-cyber text-glow mb-6 tracking-tight">
                    {timeRemaining}
                  </div>
                  
                  <div className="mb-8 bg-card/50 rounded-xl p-4 backdrop-blur-sm border border-primary/20">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted-foreground uppercase tracking-wider text-xs">{t("progress")}</span>
                      <span className="font-bold text-success text-glow">+{earnedSoFar.toFixed(8)} STK</span>
                    </div>
                    <Progress value={currentProgress} className="h-2 mb-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{currentProgress.toFixed(2)}%</span>
                      <span className="text-gradient-gold">{t("goal")}: 0.05 STK</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-8 text-sm">
                    {t("watchAdAndMine")}
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-primary hover:shadow-glow-strong transition-all duration-300 text-lg py-6 font-semibold"
                    onClick={handleStartMining}
                  >
                    <Coins className="mr-2 h-5 w-5" />
                    {t("startMining")}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 uppercase tracking-wider">
                    {t("reward")}: 0.05 STK
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card className="glass-card p-8 hover-glow border-accent/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-gold opacity-5"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6 text-gradient-gold text-glow tracking-tight">
                {t("inviteCode")}
              </h3>
              <div className="glass-card rounded-xl p-6 mb-6 border-accent/30 shadow-glow">
                <p className="text-center text-3xl font-mono font-bold text-gradient-cyber text-glow tracking-wider">
                  {profile?.referral_code}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {t("shareCode")} <span className="text-gradient-gold font-semibold">10%</span> {t("ofWhatRefsMine")}
              </p>
              <Button 
                variant="outline" 
                className="w-full border-accent/50 hover:bg-accent/10 hover:border-accent transition-all duration-300 py-6 text-lg font-semibold"
                onClick={() => {
                  navigator.clipboard.writeText(profile?.referral_code || "");
                  toast.success(t("codeCopied"));
                }}
              >
                {t("copyCode")}
              </Button>
            </div>
          </Card>
        </div>

        {/* Etapas da Stonks Network */}
        <Card className="glass-card p-6 mb-8 border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gradient-primary text-glow mb-6 tracking-tight">
              {t("stonksStages")}
            </h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* Etapa 1 */}
              <div className={`p-6 rounded-xl border-2 transition-all ${
                totalUsers < 10000 
                  ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-glow' 
                  : 'border-border/50 bg-muted/20'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-gold">
                    <Award className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gradient-gold">{t("stage")} 1</h3>
                    <p className="text-xs text-muted-foreground">{t("pioneers")}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("target")}:</span>
                    <span className="font-semibold text-foreground">10.000 {t("miners")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("rate")}:</span>
                    <span className="font-semibold text-gradient-gold">0.05 STK/{t("perDay")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("refBonus")}:</span>
                    <span className="font-semibold text-accent">10%</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t("progress")}</span>
                      <span className="font-semibold text-foreground">{totalUsers} / 10.000</span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-gold h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalUsers / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {totalUsers < 10000 && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-primary font-semibold">{t("phaseActive")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Etapa 2 */}
              <div className={`p-6 rounded-xl border-2 transition-all ${
                totalUsers >= 10000 && totalUsers < 500000
                  ? 'border-secondary bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-glow' 
                  : 'border-border/50 bg-muted/20'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-cyber">
                    <Target className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gradient-cyber">{t("stage")} 2</h3>
                    <p className="text-xs text-muted-foreground">{t("growth")}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("target")}:</span>
                    <span className="font-semibold text-foreground">500.000 {t("miners")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("rate")}:</span>
                    <span className="font-semibold text-gradient-cyber">0.0125 STK/{t("perDay")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("refBonus")}:</span>
                    <span className="font-semibold text-accent">10%</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t("progress")}</span>
                      <span className="font-semibold text-foreground">
                        {totalUsers.toLocaleString()} / 500.000
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-cyber h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalUsers / 500000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {totalUsers >= 10000 && totalUsers < 500000 && (
                    <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                      <p className="text-xs text-secondary font-semibold">{t("rocketPhaseActive")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Etapa 3 */}
              <div className={`p-6 rounded-xl border-2 transition-all ${
                totalUsers >= 500000
                  ? 'border-accent bg-gradient-to-br from-accent/20 to-accent/5 shadow-glow' 
                  : 'border-border/50 bg-muted/20'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-primary">
                    <Trophy className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gradient-primary">{t("stage")} 3</h3>
                    <p className="text-xs text-muted-foreground">{t("officialLaunch")}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("finalTarget")}:</span>
                    <span className="font-semibold text-foreground">1.000.000 {t("miners")}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-primary">{t("realLaunch")}</span> {t("miningEnded")}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t("progress")}</span>
                      <span className="font-semibold text-foreground">
                        {totalUsers.toLocaleString()} / 1.000.000
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalUsers / 1000000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {totalUsers >= 500000 && totalUsers < 1000000 && (
                    <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <p className="text-xs text-accent font-semibold">{t("finalPhase")}</p>
                    </div>
                  )}
                  
                  {totalUsers >= 1000000 && (
                    <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-xs text-success font-semibold">{t("tokenLaunched")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">{t("noteLabel")}</span> {t("noteText")}
              </p>
            </div>
          </div>
        </Card>

      </div>

      <AdDialog 
        open={showAdDialog}
        onAdCompleted={startMining}
        onClose={() => setShowAdDialog(false)}
      />
    </div>
  );
};

export default Dashboard;