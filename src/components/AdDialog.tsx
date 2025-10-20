import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdDialogProps {
  open: boolean;
  onAdCompleted: () => void;
  onClose: () => void;
}

export const AdDialog = ({ open, onAdCompleted, onClose }: AdDialogProps) => {
  const [adLoading, setAdLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Carrega o anúncio do AdSense
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
      setAdLoading(false);
    } catch (error) {
      console.error("Erro ao carregar anúncio:", error);
      setAdLoading(false);
    }

    // Countdown do anúncio
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      setCountdown(30);
      setCanSkip(false);
      setAdLoading(true);
    };
  }, [open]);

  const handleComplete = () => {
    onAdCompleted();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anúncio</DialogTitle>
          <DialogDescription>
            Assista ao anúncio completo para ativar a mineração
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          {adLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando anúncio...</p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {/* Ad Container */}
              <div className="min-h-[250px] flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg overflow-hidden border border-primary/20 p-6">
                {/* Simulated Ad Content */}
                <div className="w-full h-[250px] flex flex-col items-center justify-center text-center">
                  <div className="space-y-4">
                    <div className="text-5xl animate-pulse">🎬</div>
                    <div>
                      <p className="text-xl font-bold text-foreground mb-2">Anúncio em Vídeo</p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Este é um anúncio simulado para teste. Após publicar, anúncios reais do Google AdSense aparecerão aqui.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span>Reproduzindo anúncio...</span>
                    </div>
                  </div>
                </div>

                {/* Google AdSense (só funciona em produção) */}
                <ins
                  className="adsbygoogle hidden"
                  style={{ display: "block", width: "100%", height: "250px" }}
                  data-ad-client="ca-app-pub-3940256099942544"
                  data-ad-slot="5224354917"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
              </div>

              {/* Countdown Timer */}
              {!canSkip && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-center gap-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary text-xl font-bold animate-pulse">
                      {countdown}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Aguarde para continuar</p>
                      <p className="text-xs text-muted-foreground">
                        {countdown} segundos restantes
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-primary to-primary-glow"
                onClick={handleComplete}
                disabled={!canSkip}
              >
                {canSkip ? "Continuar para Mineração" : "Aguarde..."}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
