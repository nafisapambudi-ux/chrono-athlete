import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/RoleBadge";
import { BarChart3, Users, Dumbbell, Settings, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useUserRole(user?.id);

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  const isCoach = roles?.includes("coach") || roles?.includes("owner");
  const isAthlete = roles?.includes("athlete");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">HIROCROSS Training App</h1>
            {roles && roles.length > 0 && (
              <div className="flex gap-2 mt-2">
                {roles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            )}
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </header>

        {rolesLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profil Atlet - Coach only can manage multiple athletes */}
            {isCoach && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/profile")}>
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
            )}

            {/* Athlete's Own Dashboard - Athletes only */}
            {isAthlete && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/50" onClick={() => navigate("/my-training")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-primary" />
                    Latihan Saya
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Lihat program latihan, progres, dan perkembangan performa Anda.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Training Sessions - Coaches only */}
            {isCoach && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/training")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-6 w-6" />
                    Program Latihan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Buat dan kelola program latihan untuk atlet.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Athlete Tests - Coaches only */}
            {isCoach && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/tests")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-6 w-6" />
                    Tes & Pengukuran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Input dan lihat hasil tes bimotor atlet dengan norma berdasarkan usia dan gender.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Dashboard - Available for both roles */}
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/dashboard")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {isCoach 
                    ? "Lihat statistik, grafik, dan analisis performa semua atlet."
                    : "Lihat statistik dan progres latihan Anda."}
                </p>
              </CardContent>
            </Card>

            {/* Role Settings - For users without role */}
            {(!roles || roles.length === 0) && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed" onClick={() => navigate("/profile")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Settings className="h-6 w-6" />
                    Aktifkan Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Masukkan kode akses untuk mengaktifkan role sebagai pelatih atau atlet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;