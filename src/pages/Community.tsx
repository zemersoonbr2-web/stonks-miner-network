import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Bell } from "lucide-react";
import { toast } from "sonner";

const Community = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("reminders")
        .insert({
          sender_id: user.id,
          receiver_id: userId
        });

      toast.success("Lembrete enviado!");
    } catch (error: any) {
      if (error.message?.includes("one_reminder_per_day")) {
        toast.error("Você já enviou um lembrete para este usuário hoje");
      } else {
        toast.error("Erro ao enviar lembrete");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Comunidade
          </h1>
          <p className="text-muted-foreground">
            Veja quem está online e minerando na rede Stonks
          </p>
        </div>

        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{user.nickname}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${user.is_mining ? "bg-success" : "bg-muted"}`}></div>
                        <span className="text-muted-foreground">
                          {user.is_mining ? "Minerando" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendReminder(user.id)}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Lembrar
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;