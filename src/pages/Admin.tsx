import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Users, TrendingUp, ArrowLeft, RefreshCw, Award, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  id: string;
  nickname: string;
  balance: number;
  total_mined: number;
  referral_code: string;
  is_mining: boolean;
  mining_progress?: number;
  earning_now?: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalMined, setTotalMined] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [currentlyMining, setCurrentlyMining] = useState(0);

  useEffect(() => {
    checkAdminAndLoadData();
    
    // Setup realtime subscription for profiles
    const profileChannel = supabase
      .channel('admin-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadAdminData();
        }
      )
      .subscribe();

    // Setup realtime subscription for mining sessions
    const sessionsChannel = supabase
      .channel('admin-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_sessions'
        },
        () => {
          loadAdminData();
        }
      )
      .subscribe();

    // Update mining progress every second
    const progressInterval = setInterval(() => {
      updateMiningProgress();
    }, 1000);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(sessionsChannel);
      clearInterval(progressInterval);
    };
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar se é admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("Acesso negado. Apenas administradores.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadAdminData();
    } catch (error) {
      toast.error("Erro ao verificar permissões");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const updateMiningProgress = () => {
    setUsers(currentUsers => {
      return currentUsers.map(user => {
        if (!user.is_mining || !user.mining_progress) return user;
        
        // Calcular progresso baseado no tempo (progresso guardado temporariamente)
        return user;
      });
    });
  };

  const loadAdminData = async () => {
    try {
      // Buscar todos os usuários
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nickname, balance, total_mined, referral_code, is_mining")
        .order("balance", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar sessões de mineração ativas
      const { data: sessions, error: sessionsError } = await supabase
        .from("mining_sessions")
        .select("*")
        .eq("completed", false);

      if (sessionsError) throw sessionsError;

      console.log("=== ADMIN DEBUG ===");
      console.log("Profiles:", profiles);
      console.log("Active sessions:", sessions);

      // Calcular progresso e ganhos para cada usuário
      const now = new Date().getTime();
      const usersWithProgress: UserStats[] = profiles?.map(profile => {
        const session = sessions?.find(s => s.user_id === profile.id);
        
        if (session && profile.is_mining) {
          const start = new Date(session.started_at).getTime();
          const end = new Date(session.ends_at).getTime();
          const totalDuration = end - start; // 24 horas em ms
          const elapsed = Math.max(0, now - start); // tempo decorrido
          
          const progress = Math.min((elapsed / totalDuration) * 100, 100);
          const earning = Math.min((elapsed / totalDuration) * 0.05, 0.05);
          
          console.log(`User ${profile.nickname}:`, {
            elapsed_hours: (elapsed / (1000 * 60 * 60)).toFixed(2),
            progress: progress.toFixed(2) + '%',
            earning: earning.toFixed(8),
            balance: profile.balance
          });
          
          return {
            ...profile,
            mining_progress: progress,
            earning_now: earning
          };
        }
        
        return {
          ...profile,
          mining_progress: 0,
          earning_now: 0
        };
      }) || [];

      console.log("Users with progress:", usersWithProgress);

      setUsers(usersWithProgress);
      setTotalUsers(profiles?.length || 0);

      // Calcular total: balance + o que está sendo minerado agora
      const totalBalance = usersWithProgress.reduce((acc, user) => {
        const balance = parseFloat(user.balance?.toString() || "0");
        const earning = user.earning_now || 0;
        return acc + balance + earning;
      }, 0);
      
      const activeMining = usersWithProgress.reduce((acc, user) => {
        return acc + (user.earning_now || 0);
      }, 0);
      
      console.log("Total balance (includes mining):", totalBalance.toFixed(8));
      console.log("Currently being mined:", activeMining.toFixed(8));
      console.log("=== END DEBUG ===");
      
      setTotalMined(totalBalance);
      setCurrentlyMining(activeMining);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados administrativos");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-primary/30 hover:bg-primary/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={loadAdminData}
                className="border-accent/30 hover:bg-accent/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-gradient-primary text-glow tracking-tight">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-2 text-sm uppercase tracking-wider">
              Visão completa da rede Stonks • Atualização em tempo real
            </p>
          </div>
        </header>

        {/* Etapas de Mineração */}
        <Card className="glass-card p-6 mb-8 border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gradient-primary text-glow mb-6 tracking-tight">
              Etapas da Stonks Network
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
                    <h3 className="text-lg font-bold text-gradient-gold">Etapa 1</h3>
                    <p className="text-xs text-muted-foreground">Os Pioneiros</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta:</span>
                    <span className="font-semibold text-foreground">10.000 mineradores</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa:</span>
                    <span className="font-semibold text-gradient-gold">0.05 STK/dia</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bônus Ref:</span>
                    <span className="font-semibold text-accent">10%</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
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
                      <p className="text-xs text-primary font-semibold">🔥 FASE ATIVA</p>
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
                    <h3 className="text-lg font-bold text-gradient-cyber">Etapa 2</h3>
                    <p className="text-xs text-muted-foreground">Crescimento</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta:</span>
                    <span className="font-semibold text-foreground">500.000 mineradores</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa:</span>
                    <span className="font-semibold text-gradient-cyber">0.0125 STK/dia</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bônus Ref:</span>
                    <span className="font-semibold text-accent">10%</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">
                        {Math.max(0, totalUsers - 10000).toLocaleString()} / 490.000
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-cyber h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((Math.max(0, totalUsers - 10000) / 490000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {totalUsers >= 10000 && totalUsers < 500000 && (
                    <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                      <p className="text-xs text-secondary font-semibold">🚀 FASE ATIVA</p>
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
                    <h3 className="text-lg font-bold text-gradient-primary">Etapa 3</h3>
                    <p className="text-xs text-muted-foreground">Lançamento Oficial</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta Final:</span>
                    <span className="font-semibold text-foreground">1.000.000 mineradores</span>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-primary">🚀 Lançamento Real:</span> Mineração encerrada. 
                      Todos os tokens verificados serão distribuídos para as carteiras dos participantes. 
                      O token será lançado oficialmente no mercado.
                    </p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bônus Ref:</span>
                    <span className="font-semibold text-accent">10%</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">
                        {Math.max(0, totalUsers - 500000).toLocaleString()} / 500.000
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((Math.max(0, totalUsers - 500000) / 500000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {totalUsers >= 500000 && totalUsers < 1000000 && (
                    <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <p className="text-xs text-accent font-semibold">💥 FASE FINAL</p>
                    </div>
                  )}
                  
                  {totalUsers >= 1000000 && (
                    <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-xs text-success font-semibold">✅ TOKEN LANÇADO</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground">
                💡 <span className="font-semibold">Observação:</span> O bônus de indicação permanece fixo em 10% em todas as etapas. 
                A taxa de mineração é 0.05 STK/dia até 10k membros, depois reduz para 0.0125 STK/dia até o encerramento ao atingir 1 milhão de mineradores, 
                quando acontecerá o lançamento oficial e distribuição dos tokens.
              </p>
            </div>
          </div>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="glass-card p-6 hover-glow border-primary/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-glow">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Total em Circulação
                </p>
                <p className="text-3xl font-bold text-gradient-gold text-glow">
                  {totalMined.toFixed(8)}
                </p>
                <p className="text-xs text-muted-foreground">STK</p>
                {currentlyMining > 0 && (
                  <p className="text-xs text-success text-glow mt-1">
                    +{currentlyMining.toFixed(8)} sendo minerado agora
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 hover-glow border-secondary/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-glow">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Total de Usuários
                </p>
                <p className="text-3xl font-bold text-gradient-cyber text-glow">
                  {totalUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 hover-glow border-accent/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 shadow-glow">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Minerando Agora
                </p>
                <p className="text-3xl font-bold text-gradient-cyber text-glow">
                  {users.filter(u => u.is_mining).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Usuários */}
        <Card className="glass-card p-6 border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gradient-primary text-glow mb-6 tracking-tight">
              Ranking de Usuários
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      #
                    </th>
                    <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Nome
                    </th>
                    <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Código
                    </th>
                    <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Saldo Atual (STK)
                    </th>
                    <th className="text-right py-4 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Total Minerado (STK)
                    </th>
                    <th className="text-center py-4 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="text-gradient-gold font-bold text-lg">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-foreground">
                          {user.nickname}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          {user.referral_code}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="text-gradient-gold font-bold text-lg">
                              {(parseFloat(user.balance?.toString() || "0") + (user.earning_now || 0)).toFixed(8)}
                            </span>
                            <span className="text-xs text-muted-foreground">STK</span>
                          </div>
                          {user.earning_now && user.earning_now > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                              <span className="text-xs text-success font-semibold">
                                Minerando: +{user.earning_now.toFixed(8)}
                              </span>
                            </div>
                          )}
                          {user.mining_progress && user.mining_progress > 0 && (
                            <div className="mt-2 w-full bg-muted/30 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-primary to-accent h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${user.mining_progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-gradient-cyber font-semibold text-base">
                            {parseFloat(user.total_mined?.toString() || "0").toFixed(8)}
                          </span>
                          <span className="text-xs text-muted-foreground">STK</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            user.is_mining
                              ? "bg-success/20 text-success"
                              : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {user.is_mining ? "Minerando" : "Parado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
