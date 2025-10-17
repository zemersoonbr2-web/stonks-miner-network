import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, ExternalLink } from "lucide-react";

const Support = () => {
  const navigate = useNavigate();

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

        <div className="text-center mb-12">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Apoie o Projeto</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ajude o Stonks Network a crescer mais forte! Cada compra feita através dos nossos links ajuda a manter o projeto ativo e em constante evolução.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-card via-primary/5 to-primary/10 border-primary/30">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AliExpress</h3>
            <p className="text-muted-foreground mb-6">
              Compre no AliExpress e ajude o projeto a crescer
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              asChild
            >
              <a 
                href="https://aliexpress.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Ir para AliExpress
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-card via-primary/5 to-primary/10 border-primary/30">
          <h2 className="text-2xl font-bold mb-4 text-center">Como funciona?</h2>
          <div className="space-y-4 text-muted-foreground">
            <p className="flex items-start gap-3">
              <span className="text-2xl">1.</span>
              <span>Clique no botão acima para ser redirecionado para o AliExpress</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">2.</span>
              <span>Faça suas compras normalmente como você faria</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">3.</span>
              <span>Uma pequena comissão da sua compra é repassada para o Stonks Network, sem custo adicional para você</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">4.</span>
              <span>Você ainda pode ganhar tokens extras em promoções especiais!</span>
            </p>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-success/10 border border-success/30">
            <p className="text-center font-medium">
              💚 Obrigado por apoiar o Stonks Network! Juntos somos mais fortes!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Support;