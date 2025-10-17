import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Coins, Users, TrendingUp, Shield, Zap, Globe } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
            <Coins className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            Stonks Network
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A nova moeda digital que recompensa seu engajamento diário
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Fazer Login
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Mineração Fácil</h3>
            <p className="text-muted-foreground">
              Mine tokens diariamente de forma simples. Apenas 1 clique por dia para ativar sua mineração de 24 horas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-success/20 hover:border-success/40 transition-all hover:shadow-lg">
            <div className="p-3 rounded-lg bg-success/10 w-fit mb-4">
              <Users className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sistema de Referência</h3>
            <p className="text-muted-foreground">
              Ganhe 10% do que seus indicados mineram. Construa sua rede e maximize seus ganhos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-warning/20 hover:border-warning/40 transition-all hover:shadow-lg">
            <div className="p-3 rounded-lg bg-warning/10 w-fit mb-4">
              <TrendingUp className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-xl font-bold mb-2">Crescimento Real</h3>
            <p className="text-muted-foreground">
              Seu engajamento é recompensado. Quanto mais ativo, maiores os benefícios na rede.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Seguro e Confiável</h3>
            <p className="text-muted-foreground">
              Sistema anti-fraude robusto, KYC para saques e monitoramento constante.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-success/20 hover:border-success/40 transition-all hover:shadow-lg">
            <div className="p-3 rounded-lg bg-success/10 w-fit mb-4">
              <Globe className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Comunidade Global</h3>
            <p className="text-muted-foreground">
              Faça parte de uma comunidade crescente de mineradores em todo o mundo.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-warning/20 hover:border-warning/40 transition-all hover:shadow-lg">
            <div className="p-3 rounded-lg bg-warning/10 w-fit mb-4">
              <Coins className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tokens Valiosos</h3>
            <p className="text-muted-foreground">
              STK é uma moeda digital com potencial de crescimento baseada no engajamento da comunidade.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a milhares de usuários que já estão minerando STK
          </p>
          <Button 
            size="lg" 
            className="text-lg px-12 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
