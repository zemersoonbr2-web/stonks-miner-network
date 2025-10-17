import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Users, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AdDialog } from "@/components/AdDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [miningSession, setMiningSession] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [earnedSoFar, setEarnedSoFar] = useState(0);

  useEffect(() => {
    loadProfile();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

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
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const updateTimer = () => {
    if (!miningSession) return;
    
    const now = new Date().getTime();
    const start = new Date(miningSession.started_at).getTime();
    const end = new Date(miningSession.ends_at).getTime();
    const totalDuration = end - start;
    const elapsed = now - start;
    const diff = end - now;

    if (diff <= 0) {
      setTimeRemaining("00:00:00");
      setCurrentProgress(100);
      setEarnedSoFar(0.05);
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
    if (!miningSession) return;

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
        toast.error(result.error || "Erro ao completar mineração");
        return;
      }

      toast.success(`Mineração concluída! Você ganhou ${result.reward} STK`);
      loadProfile();
    } catch (error) {
      toast.error("Erro ao completar mineração");
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Stonks Network
              </h1>
              <p className="text-muted-foreground mt-1">Bem-vindo, {profile?.nickname}!</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Perfil
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-accent/20 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="text-2xl font-bold">
                  {(parseFloat(profile?.balance || 0) + earnedSoFar).toFixed(8)} STK
                </p>
                {profile?.is_mining && earnedSoFar > 0 && (
                  <p className="text-xs text-success mt-1">+{earnedSoFar.toFixed(8)} minerando</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-success/10 border-success/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Minerado</p>
                <p className="text-2xl font-bold">{parseFloat(profile?.total_mined || 0).toFixed(4)} STK</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-warning/10 border-warning/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referências</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/10 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-bold">{profile?.is_mining ? "Minerando" : "Parado"}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-8 bg-gradient-to-br from-card via-primary/5 to-primary/10 border-primary/30">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <Coins className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Mineração Diária</h2>
              {profile?.is_mining ? (
                <>
                  <p className="text-muted-foreground mb-4">Mineração em andamento</p>
                  <div className="text-5xl font-bold text-primary mb-4">{timeRemaining}</div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-bold text-success">+{earnedSoFar.toFixed(8)} STK</span>
                    </div>
                    <Progress value={currentProgress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{currentProgress.toFixed(2)}%</span>
                      <span>0.05 STK no total</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    Assista um anúncio e mine 0.05 STK por 24 horas
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                    onClick={handleStartMining}
                  >
                    Ativar Mineração
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    * Necessário assistir anúncio completo
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold mb-4">Seu Código de Convite</h3>
            <div className="bg-accent/50 rounded-lg p-4 mb-4">
              <p className="text-center text-2xl font-mono font-bold text-primary">
                {profile?.referral_code}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Compartilhe seu código e ganhe 10% do que seus indicados mineram!
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(profile?.referral_code || "");
                toast.success("Código copiado!");
              }}
            >
              Copiar Código
            </Button>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/community")}
          >
            <Users className="mr-2 h-4 w-4" />
            Comunidade
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/support")}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Apoie o Projeto
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
          >
            Sair
          </Button>
        </div>
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