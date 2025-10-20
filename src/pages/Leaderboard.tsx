import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import stonksLogo from "@/assets/stonks-coin-logo.png";

interface LeaderboardEntry {
  id: string;
  nickname: string;
  balance: number;
  total_mined: number;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [topMiners, setTopMiners] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar top 100 mineradores
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname, balance, total_mined")
        .order("total_mined", { ascending: false })
        .limit(100);

      if (profiles) {
        const ranked = profiles.map((p, idx) => ({
          ...p,
          rank: idx + 1,
          balance: parseFloat(String(p.balance || 0)),
          total_mined: parseFloat(String(p.total_mined || 0))
        }));
        
        setTopMiners(ranked);

        // Encontrar posição do usuário atual
        if (user) {
          const userEntry = ranked.find(p => p.id === user.id);
          if (userEntry) {
            setUserRank(userEntry);
          } else {
            // Se não está no top 100, buscar posição exata
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("id, nickname, balance, total_mined")
              .eq("id", user.id)
              .single();

            if (userProfile) {
              const { count } = await supabase
                .from("profiles")
                .select("*", { count: 'exact', head: true })
                .gt("total_mined", userProfile.total_mined);

              setUserRank({
                ...userProfile,
                rank: (count || 0) + 1,
                balance: parseFloat(String(userProfile.balance || 0)),
                total_mined: parseFloat(String(userProfile.total_mined || 0))
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />;
    return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return "border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 to-transparent";
    if (rank === 2) return "border-gray-400/50 bg-gradient-to-r from-gray-400/10 to-transparent";
    if (rank === 3) return "border-orange-400/50 bg-gradient-to-r from-orange-400/10 to-transparent";
    return "border-primary/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-gradient-gold">
            <Trophy className="h-10 w-10 text-primary" />
            Ranking Global
          </h1>
          <p className="text-muted-foreground">
            Os maiores mineradores da Stonks Network
          </p>
        </div>

        {/* Posição do usuário */}
        {userRank && (
          <Card className="glass-card p-6 mb-6 border-accent/50 shadow-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-accent">#{userRank.rank}</div>
                <div>
                  <p className="font-bold text-lg">{userRank.nickname}</p>
                  <p className="text-sm text-muted-foreground">Sua posição</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <img src={stonksLogo} alt="STK" className="w-5 h-5" />
                  <p className="text-xl font-bold text-gradient-gold">
                    {userRank.total_mined.toFixed(4)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Total Minerado</p>
              </div>
            </div>
          </Card>
        )}

        {/* Top mineradores */}
        <div className="space-y-3">
          {topMiners.map((miner) => (
            <Card 
              key={miner.id} 
              className={`p-5 hover:shadow-lg transition-all ${getRankClass(miner.rank)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card/50">
                    {getRankIcon(miner.rank)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{miner.rank}</span>
                      <span className="text-lg font-bold">{miner.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Saldo: {miner.balance.toFixed(4)} STK</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <img src={stonksLogo} alt="STK" className="w-5 h-5" />
                    <p className="text-xl font-bold text-gradient-gold">
                      {miner.total_mined.toFixed(4)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Minerado</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
