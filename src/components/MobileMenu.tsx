import { useState } from "react";
import { Menu, X, User, Users, LifeBuoy, Shield, LogOut, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileMenuProps {
  isAdmin?: boolean;
  nickname?: string;
}

export const MobileMenu = ({ isAdmin, nickname }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const menuItems = [
    { icon: User, label: t("profile"), path: "/profile" },
    { icon: Users, label: t("community"), path: "/community" },
    { icon: LifeBuoy, label: t("supportProject"), path: "/support" },
  ];

  if (isAdmin) {
    menuItems.push({ icon: Shield, label: t("admin"), path: "/admin" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 glass-card border-primary/30">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-gradient-primary">
            {t("stonksNetwork")}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t("welcomeUser")}, <span className="text-gradient-cyber font-semibold">{nickname}</span>
          </p>
        </SheetHeader>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}

          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => {
              navigate("/leaderboard");
              setOpen(false);
            }}
          >
            <Trophy className="mr-3 h-5 w-5" />
            {t("ranking")}
          </Button>

          <div className="pt-4 mt-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {t("logout") || "Sair"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
