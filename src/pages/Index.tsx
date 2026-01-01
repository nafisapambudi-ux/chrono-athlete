import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">HIRO Training App</h1>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/profile")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Profil Atlet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Kelola data atlet, tambah atlet baru, dan perbarui informasi profil.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/training")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-6 w-6" />
                Training Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Catat sesi latihan, RPE, dan data kesiapan atlet.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Lihat statistik, grafik, dan analisis performa atlet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
