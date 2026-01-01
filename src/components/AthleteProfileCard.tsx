import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Ruler, Weight, Activity, Trophy } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  mass: number | null;
  body_height: number | null;
  vertical_jump: number | null;
  avatar_url: string | null;
  sports_branch: string | null;
}

interface AthleteProfileCardProps {
  athlete: Athlete;
}

export function AthleteProfileCard({ athlete }: AthleteProfileCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Profil Atlet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {athlete.avatar_url ? (
              <img
                src={athlete.avatar_url}
                alt={athlete.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold">{athlete.name}</h3>
            
            {athlete.sports_branch && (
              <Badge variant="secondary" className="mb-2">
                <Trophy className="h-3 w-3 mr-1" />
                {athlete.sports_branch}
              </Badge>
            )}

            <div className="grid grid-cols-3 gap-3 mt-3">
              {athlete.body_height && (
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-semibold">{athlete.body_height}</span> cm
                  </span>
                </div>
              )}
              {athlete.mass && (
                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-semibold">{athlete.mass}</span> kg
                  </span>
                </div>
              )}
              {athlete.vertical_jump && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-semibold">{athlete.vertical_jump}</span> cm
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
