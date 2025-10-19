import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { ChatDialog } from "@/components/ChatDialog";

const Community = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; nickname: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar amigos através da tabela de referrals
      const { data: referrals } = await supabase
        .from("referrals")
        .select("referrer_id, referred_id")
        .or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`);

      if (!referrals || referrals.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Extrair IDs dos amigos
      const friendIds = referrals.map(r => 
        r.referrer_id === user.id ? r.referred_id : r.referrer_id
      );

      // Buscar perfis dos amigos
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds);

      setFriends(profiles || []);
    } catch (error) {
      toast.error("Erro ao carregar amigos");
    } finally {
      setLoading(false);
    }
  };

  const openChat = (friendId: string, friendNickname: string) => {
    setSelectedFriend({ id: friendId, nickname: friendNickname });
    setChatOpen(true);
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
            Meus Amigos
          </h1>
          <p className="text-muted-foreground">
            Amigos conectados por indicação - converse com eles!
          </p>
        </div>

        <div className="grid gap-4">
          {friends.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-2">Você ainda não tem amigos</p>
              <p className="text-sm text-muted-foreground">
                Indique pessoas para começar a minerar juntos!
              </p>
            </Card>
          ) : (
            friends.map((friend) => (
              <Card key={friend.id} className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{friend.nickname}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${friend.is_mining ? "bg-success" : "bg-muted"}`}></div>
                        <span className="text-muted-foreground">
                          {friend.is_mining ? "Minerando" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openChat(friend.id, friend.nickname)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {selectedFriend && (
          <ChatDialog
            open={chatOpen}
            onOpenChange={setChatOpen}
            friendId={selectedFriend.id}
            friendNickname={selectedFriend.nickname}
          />
        )}
      </div>
    </div>
  );
};

export default Community;