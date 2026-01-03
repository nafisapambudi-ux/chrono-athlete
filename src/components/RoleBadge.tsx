import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleBadgeProps {
  role: AppRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    owner: {
      label: "Owner",
      className: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    },
    coach: {
      label: "Pelatih",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    },
    athlete: {
      label: "Atlet",
      className: "bg-green-500/20 text-green-400 border-green-500/50",
    },
  };

  const config = roleConfig[role];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
