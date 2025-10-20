import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Coins, Users, TrendingUp, Shield, Zap, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import stonksCoinLogo from "@/assets/stonks-coin-logo.png";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a referral code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Redirect to auth page with the referral code
      navigate(`/auth?ref=${refCode}`);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium text-primary">Nova Era Digital</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Stonks Network
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              A revolução da mineração digital chegou. Mine tokens diariamente e construa seu patrimônio digital de forma simples e segura.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 group"
                onClick={() => navigate("/auth")}
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 border-primary/30 hover:border-primary/50"
                onClick={() => navigate("/auth")}
              >
                Fazer Login
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-6">
              <div>
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div>
                <div className="text-2xl font-bold text-primary">1M+</div>
                <div className="text-sm text-muted-foreground">STKN Minerados</div>
              </div>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-glow/20 blur-3xl"></div>
            <div className="relative">
              <div className="w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl bg-card/50 backdrop-blur animate-float">
                <img 
                  src={stonksCoinLogo} 
                  alt="Stonks Coin" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-primary to-primary-glow rounded-full p-4 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher Stonks Network?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para mineração digital com foco em simplicidade e segurança
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mineração Fácil</h3>
              <p className="text-muted-foreground leading-relaxed">
                Mine tokens diariamente de forma simples. Apenas 1 clique por dia para ativar sua mineração de 24 horas.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-success/20 hover:border-success/40 transition-all hover:shadow-2xl hover:shadow-success/10 hover:-translate-y-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-success/10 to-success/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sistema de Referência</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ganhe 10% do que seus indicados mineram. Construa sua rede e maximize seus ganhos.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-warning/20 hover:border-warning/40 transition-all hover:shadow-2xl hover:shadow-warning/10 hover:-translate-y-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Crescimento Real</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seu engajamento é recompensado. Quanto mais ativo, maiores os benefícios na rede.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Seguro e Confiável</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sistema anti-fraude robusto, KYC para saques e monitoramento constante.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-success/20 hover:border-success/40 transition-all hover:shadow-2xl hover:shadow-success/10 hover:-translate-y-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-success/10 to-success/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Globe className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Comunidade Global</h3>
              <p className="text-muted-foreground leading-relaxed">
                Faça parte de uma comunidade crescente de mineradores em todo o mundo.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur border border-warning/20 hover:border-warning/40 transition-all hover:shadow-2xl hover:shadow-warning/10 hover:-translate-y-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Coins className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tokens Valiosos</h3>
              <p className="text-muted-foreground leading-relaxed">
                STKN é uma moeda digital com potencial de crescimento baseada no engajamento da comunidade.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-card/80 to-card/40 backdrop-blur border border-primary/20 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para começar sua jornada?</h2>
          <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já estão minerando STKN e construindo seu patrimônio digital
          </p>
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all group"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
