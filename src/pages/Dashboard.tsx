import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Users, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [miningSession, setMiningSession] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimer = () => {
    if (!miningSession) return;
    
    const now = new Date().getTime();
    const end = new Date(miningSession.ends_at).getTime();
    const diff = end - now;

    if (diff <= 0) {
      setTimeRemaining("00:00:00");
      completeMining();
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  const completeMining = async () => {
    if (!miningSession || !profile) return;

    try {
      await supabase
        .from("mining_sessions")
        .update({ completed: true })
        .eq("id", miningSession.id);

      const newBalance = parseFloat(profile.balance) + parseFloat(miningSession.amount);
      await supabase
        .from("profiles")
        .update({ 
          balance: newBalance,
          is_mining: false,
          total_mined: parseFloat(profile.total_mined) + parseFloat(miningSession.amount)
        })
        .eq("id", profile.id);

      await supabase
        .from("transactions")
        .insert({
          user_id: profile.id,
          type: "mining",
          amount: miningSession.amount,
          description: "Mineração diária concluída"
        });

      toast.success("Mineração concluída! Tokens adicionados ao seu saldo.");
      loadProfile();
      setMiningSession(null);
    } catch (error) {
      console.error("Error completing mining:", error);
      toast.error("Erro ao completar mineração");
    }
  };

  const startMining = async () => {
    if (!profile) return;

    try {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: newSession } = await supabase
        .from("mining_sessions")
        .insert({
          user_id: profile.id,
          ends_at: endsAt.toISOString(),
          ad_watched: true
        })
        .select()
        .single();

      await supabase
        .from("profiles")
        .update({ 
          is_mining: true,
          last_mining_at: now.toISOString()
        })
        .eq("id", profile.id);

      setMiningSession(newSession);
      toast.success("Mineração iniciada! Volte em 24 horas.");
      loadProfile();
    } catch (error) {
      console.error("Error starting mining:", error);
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
                <p className="text-2xl font-bold">{parseFloat(profile?.balance || 0).toFixed(4)} STK</p>
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
                  <p className="text-muted-foreground mb-6">Mineração em andamento</p>
                  <div className="text-5xl font-bold text-primary mb-6">{timeRemaining}</div>
                  <p className="text-sm text-muted-foreground">
                    Você receberá {miningSession?.amount || 0.05} STK quando concluir
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    Assista um anúncio e mine 0.05 STK por 24 horas
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                    onClick={startMining}
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
    </div>
  );
};

export default Dashboard;