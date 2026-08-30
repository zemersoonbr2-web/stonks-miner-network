import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Coins, Users, TrendingUp, Shield, Zap, Globe, ArrowRight, CheckCircle2, ChevronRight, Sparkles, Star } from "lucide-react";
import stonksCoinLogo from "@/assets/stonks-coin-logo.png";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      navigate(`/auth?ref=${refCode}`);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={stonksCoinLogo} alt="STKN" className="w-8 h-8 rounded-full" />
            <span className="text-lg font-bold text-gradient-primary">Stonks Network</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/auth")}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              className="bg-gradient-primary hover:opacity-90 text-sm px-5"
              onClick={() => navigate("/auth")}
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Mineracao Digital</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              <span className="text-foreground">Mine tokens.</span>
              <br />
              <span className="text-gradient-primary">Construa seu</span>
              <br />
              <span className="text-gradient-gold">patrimonio digital.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              A Stonks Network permite que voce mine STKN diariamente com apenas um clique.
              Convide amigos, suba no ranking e acompanhe seu crescimento em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-base px-8 py-6 bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/25 group"
                onClick={() => navigate("/auth")}
              >
                Comecar Agora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 border-border/60 hover:bg-card/60"
                onClick={() => navigate("/auth")}
              >
                Saiba Mais
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-primary">10K+</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Mineradores</div>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-gold">1M+</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">STKN Minerados</div>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-cyber">24h</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Ciclo de Mineracao</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute inset-0 -m-8">
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full border border-primary/10" />
              </div>
              {/* Coin image */}
              <div className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 bg-card/30 backdrop-blur-sm animate-float">
                <img
                  src={stonksCoinLogo}
                  alt="Stonks Coin"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 glass-card rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg border-primary/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-foreground">Rede Ativa</span>
              </div>
              <div className="absolute -bottom-2 -left-2 glass-card rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg border-accent/30">
                <Coins className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold text-foreground">0.05 STKN/dia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-20 md:py-28 border-t border-border/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Como funciona</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Tres passos simples</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Comece a minerar STKN em menos de 2 minutos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Crie sua conta",
                desc: "Cadastre-se gratuitamente com email e senha. Escolha um nickname unico na rede.",
                icon: Users,
                color: "primary"
              },
              {
                step: "02",
                title: "Ative a mineracao",
                desc: "Com um clique diario, ative seu ciclo de 24 horas e comece a acumular STKN.",
                icon: Zap,
                color: "accent"
              },
              {
                step: "03",
                title: "Convide e cresca",
                desc: "Compartilhe seu codigo de referencia e ganhe 10% do que seus indicados mineram.",
                icon: TrendingUp,
                color: "warning"
              }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="glass-card rounded-2xl p-8 h-full border-border/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-5xl font-black text-primary/10 mb-4">{item.step}</div>
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${
                    item.color === 'primary' ? 'bg-primary/10' :
                    item.color === 'accent' ? 'bg-accent/10' : 'bg-warning/10'
                  }`}>
                    <item.icon className={`h-6 w-6 ${
                      item.color === 'primary' ? 'text-primary' :
                      item.color === 'accent' ? 'text-accent' : 'text-warning'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 md:py-28 border-t border-border/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Por que escolher a Stonks Network?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa para mineracao digital com foco em simplicidade e seguranca
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Mineracao Facil",
                desc: "Mine tokens diariamente com apenas 1 clique. Ciclo automatico de 24 horas.",
                gradient: "from-primary/15 to-primary/5",
                border: "border-primary/20 hover:border-primary/40",
                iconColor: "text-primary"
              },
              {
                icon: Users,
                title: "Sistema de Referencia",
                desc: "Ganhe 10% do que seus indicados mineram. Construa sua rede e maximize ganhos.",
                gradient: "from-secondary/15 to-secondary/5",
                border: "border-secondary/20 hover:border-secondary/40",
                iconColor: "text-secondary"
              },
              {
                icon: TrendingUp,
                title: "Crescimento Real",
                desc: "Seu engajamento e recompensado. Quanto mais ativo, maiores os beneficios.",
                gradient: "from-accent/15 to-accent/5",
                border: "border-accent/20 hover:border-accent/40",
                iconColor: "text-accent"
              },
              {
                icon: Shield,
                title: "Seguro e Confiavel",
                desc: "Sistema anti-fraude robusto, KYC para saques e monitoramento constante.",
                gradient: "from-primary/15 to-primary/5",
                border: "border-primary/20 hover:border-primary/40",
                iconColor: "text-primary"
              },
              {
                icon: Globe,
                title: "Comunidade Global",
                desc: "Faca parte de uma comunidade crescente de mineradores em todo o mundo.",
                gradient: "from-secondary/15 to-secondary/5",
                border: "border-secondary/20 hover:border-secondary/40",
                iconColor: "text-secondary"
              },
              {
                icon: Coins,
                title: "Tokens Valiosos",
                desc: "STKN e uma moeda digital com potencial de crescimento baseada na comunidade.",
                gradient: "from-warning/15 to-warning/5",
                border: "border-warning/20 hover:border-warning/40",
                iconColor: "text-warning"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className={`group glass-card rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feature.border}`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 md:py-28 border-t border-border/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="absolute inset-0 -m-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-2xl" />
            <div className="relative glass-card rounded-3xl p-12 md:p-16 border-primary/20">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-6">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para comecar?</h2>
              <p className="text-muted-foreground mb-8 text-lg max-w-lg mx-auto">
                Junte-se a milhares de mineradores que ja estao construindo seu patrimonio digital com STKN
              </p>
              <Button
                size="lg"
                className="text-base px-10 py-6 bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/25 group"
                onClick={() => navigate("/auth")}
              >
                Criar Conta Gratis
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-xs text-muted-foreground mt-6">Sem cartao de credito. 100% gratuito.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={stonksCoinLogo} alt="STKN" className="w-5 h-5 rounded-full" />
            <span className="text-sm text-muted-foreground">Stonks Network</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Stonks Network. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
