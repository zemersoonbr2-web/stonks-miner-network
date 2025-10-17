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

    // Simula o carregamento do anúncio
    const loadTimer = setTimeout(() => {
      setAdLoading(false);
    }, 2000);

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
      clearTimeout(loadTimer);
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
            <div className="w-full">
              {/* Área do anúncio - pode ser substituído por Google AdSense */}
              <div className="bg-muted rounded-lg p-8 mb-4 min-h-[300px] flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">📺</div>
                  <h3 className="text-xl font-bold">Anúncio em Exibição</h3>
                  <p className="text-muted-foreground">
                    Este é um anúncio simulado. Em produção, aqui será exibido um anúncio real.
                  </p>
                  {!canSkip && (
                    <div className="mt-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                        {countdown}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        segundos restantes
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
