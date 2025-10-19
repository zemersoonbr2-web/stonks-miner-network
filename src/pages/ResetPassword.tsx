import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { z } from "zod";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Capture token from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      setIsValidToken(true);
    } else {
      toast.error("Link de recuperação inválido ou expirado");
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        toast.error("As senhas não coincidem");
        setLoading(false);
        return;
      }

      // Validate password strength
      const passwordValidation = z.string()
        .min(8, "Senha deve ter no mínimo 8 caracteres")
        .max(72, "Senha muito longa")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter letras maiúsculas, minúsculas e números")
        .safeParse(newPassword);

      if (!passwordValidation.success) {
        toast.error(passwordValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error("Erro ao atualizar senha: " + error.message);
        setLoading(false);
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erro ao processar solicitação");
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <Coins className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Redefinir Senha
          </h1>
          <p className="text-muted-foreground mt-2">
            Digite sua nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Digite a senha novamente"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm text-primary hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
