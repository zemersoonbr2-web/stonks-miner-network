import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, TrendingUp, Users, Clock } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

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
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
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
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="space-y-6">
          <Card className="p-8 bg-gradient-to-br from-card via-primary/5 to-primary/10 border-primary/30">
            <div className="flex items-center gap-6 mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Coins className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{profile?.nickname}</h1>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground mb-1">Saldo Total</p>
                <p className="text-2xl font-bold text-primary">
                  {parseFloat(profile?.balance || 0).toFixed(4)} STK
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground mb-1">Total Minerado</p>
                <p className="text-2xl font-bold text-success">
                  {parseFloat(profile?.total_mined || 0).toFixed(4)} STK
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-accent/20 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Código de Convite</p>
              <p className="text-xl font-mono font-bold text-primary">{profile?.referral_code}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
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
                    className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {tx.type === "mining" && (
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Coins className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {tx.type === "referral" && (
                        <div className="p-2 rounded-lg bg-warning/10">
                          <Users className="h-4 w-4 text-warning" />
                        </div>
                      )}
                      {tx.type === "withdrawal" && (
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <TrendingUp className="h-4 w-4 text-destructive" />
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
                      {parseFloat(tx.amount).toFixed(4)} STK
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Informações da Conta</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">{profile?.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">KYC Verificado</span>
                <span className={`font-medium ${profile?.kyc_verified ? "text-success" : "text-warning"}`}>
                  {profile?.kyc_verified ? "Verificado" : "Pendente"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Status da Conta</span>
                <span className={`font-medium ${profile?.is_blocked ? "text-destructive" : "text-success"}`}>
                  {profile?.is_blocked ? "Bloqueada" : "Ativa"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Membro desde</span>
                <span className="font-medium">
                  {new Date(profile?.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;