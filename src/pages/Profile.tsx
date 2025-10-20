import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, TrendingUp, Users, Clock, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [miningSession, setMiningSession] = useState<any>(null);
  const [earnedSoFar, setEarnedSoFar] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (!miningSession) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(miningSession.started_at).getTime();
      const end = new Date(miningSession.ends_at).getTime();
      const totalDuration = end - start;
      const elapsed = now - start;
      
      if (elapsed >= totalDuration) {
        setEarnedSoFar(0.05);
      } else {
        const earned = (elapsed / totalDuration) * 0.05;
        setEarnedSoFar(earned);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [miningSession]);

  const loadProfileData = async () => {
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

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setProfile(profileData);
      setTransactions(transactionsData || []);
      
      // Load mining session if active
      if (profileData?.is_mining) {
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
    } catch (error) {
      // Error silently handled - user will be redirected by auth guard
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          throw new Error(t("adminCannotDelete"));
        }
        throw new Error(errorData.error || "Failed to delete account");
      }

      toast({
        title: t("accountDeleted"),
      });

      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      toast({
        title: t("accountDeleteError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-6 hover-glow"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="space-y-6">
          <Card className="p-8 glass-card shadow-glow">
            <div className="flex items-center gap-6 mb-6">
              <div className="p-4 rounded-full bg-gradient-primary shadow-glow">
                <Coins className="h-12 w-12 text-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-primary">{profile?.nickname}</h1>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-6 rounded-lg glass-card shadow-glow">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Saldo Total</p>
                <p className="text-3xl font-bold text-gradient-primary">
                  {(parseFloat(profile?.balance || 0) + earnedSoFar).toFixed(8)} STKN
                </p>
                {profile?.is_mining && earnedSoFar > 0 && (
                  <p className="text-xs text-success mt-2">+{earnedSoFar.toFixed(8)} STKN minerando</p>
                )}
              </div>
              <div className="p-6 rounded-lg glass-card shadow-glow">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Status</p>
                <p className="text-3xl font-bold text-gradient-cyber">
                  {profile?.is_mining ? "Minerando" : "Parado"}
                </p>
                {profile?.is_mining && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Mineração ativa (0.05 STKN em 24h)
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg glass-card border border-primary/30">
              <p className="text-sm text-muted-foreground mb-2">Código de Convite</p>
              <p className="text-xl font-mono font-bold text-gradient-gold">{profile?.referral_code}</p>
            </div>
          </Card>

          <Card className="p-6 glass-card shadow-glow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gradient-primary">
              <Clock className="h-5 w-5" />
              Histórico de Transações
            </h2>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação ainda
                </p>
              ) : (
                transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg glass-card hover-glow"
                  >
                    <div className="flex items-center gap-3">
                      {tx.type === "mining" && (
                        <div className="p-2 rounded-lg bg-gradient-primary">
                          <Coins className="h-4 w-4 text-foreground" />
                        </div>
                      )}
                      {tx.type === "referral" && (
                        <div className="p-2 rounded-lg bg-gradient-gold">
                          <Users className="h-4 w-4 text-foreground" />
                        </div>
                      )}
                      {tx.type === "withdrawal" && (
                        <div className="p-2 rounded-lg bg-gradient-cyber">
                          <TrendingUp className="h-4 w-4 text-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${
                      parseFloat(tx.amount) > 0 ? "text-success" : "text-destructive"
                    }`}>
                      {parseFloat(tx.amount) > 0 ? "+" : ""}
                      {parseFloat(tx.amount).toFixed(4)} STKN
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 glass-card shadow-glow">
            <h2 className="text-xl font-bold mb-4 text-gradient-primary">{t("accountInfo")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t("phone")}</span>
                <span className="font-medium">{profile?.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t("kycVerified")}</span>
                <span className={`font-medium ${profile?.kyc_verified ? "text-success" : "text-warning"}`}>
                  {profile?.kyc_verified ? t("verified") : t("pending")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t("accountStatus")}</span>
                <span className={`font-medium ${profile?.is_blocked ? "text-destructive" : "text-success"}`}>
                  {profile?.is_blocked ? t("blocked") : t("active")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t("memberSince")}</span>
                <span className="font-medium">
                  {new Date(profile?.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteAccountTitle")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      {t("deleteAccountWarning")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("deleteAccountCancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? t("processing") : t("deleteAccountConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;