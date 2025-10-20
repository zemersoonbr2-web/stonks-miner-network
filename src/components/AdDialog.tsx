import { useEffect, useState, useRef } from "react";
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
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!open) return;

    // Carrega o anúncio do AdSense
    try {
      if (window.adsbygoogle && adRef.current) {
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
            <div className="w-full">
              {/* Google AdMob/AdSense */}
              <div className="mb-4 min-h-[250px] flex flex-col items-center justify-center bg-muted rounded-lg overflow-hidden">
                <ins
                  ref={adRef}
                  className="adsbygoogle"
                  style={{ display: "block" }}
                  data-ad-client="ca-app-pub-3940256099942544"
                  data-ad-slot="5224354917"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
                
                {!canSkip && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                        {countdown}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        segundos restantes
                      </p>
                    </div>
                  </div>
                )}
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
