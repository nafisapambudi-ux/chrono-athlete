import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes, Athlete } from "@/hooks/useAthletes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ArrowUpDown, User, Pencil, BarChart3, Dumbbell, ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AthleteEditDialog } from "@/components/AthleteEditDialog";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { athletes, isLoading: athletesLoading, createAthlete, updateAthlete, deleteAthlete } = useAthletes();
  const { toast } = useToast();

  // Filter and sort states
  const [athleteSearch, setAthleteSearch] = useState("");
  const [athleteSortBy, setAthleteSortBy] = useState<"name" | "created_at">("created_at");

  const [athleteForm, setAthleteForm] = useState({
    name: "",
    bodyHeight: "",
    mass: "",
    verticalJump: "",
    sportsBranch: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);

  const handleEditAthlete = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setEditDialogOpen(true);
  };

  // Filtered and sorted athletes
  const filteredAthletes = useMemo(() => {
    let filtered = athletes.filter(athlete =>
      athlete.name.toLowerCase().includes(athleteSearch.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (athleteSortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [athletes, athleteSearch, athleteSortBy]);

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    let avatarUrl: string | undefined = undefined;
    
    // Upload avatar if file is selected
    if (avatarFile && user) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('athlete-avatars')
        .upload(fileName, avatarFile);
      
      if (uploadError) {
        toast({ title: "Gagal mengunggah foto", description: uploadError.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('athlete-avatars')
        .getPublicUrl(fileName);
      
      avatarUrl = publicUrl;
    }
    
    createAthlete({
      name: athleteForm.name,
      body_height: athleteForm.bodyHeight ? Number(athleteForm.bodyHeight) : undefined,
      mass: athleteForm.mass ? Number(athleteForm.mass) : undefined,
      vertical_jump: athleteForm.verticalJump ? Number(athleteForm.verticalJump) : undefined,
      avatar_url: avatarUrl,
      sports_branch: athleteForm.sportsBranch || undefined,
    });
    
    setAthleteForm({ name: "", bodyHeight: "", mass: "", verticalJump: "", sportsBranch: "" });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsUploading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/app")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold text-foreground">Profil Atlet</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/training")} variant="outline">
              <Dumbbell className="mr-2 h-4 w-4" />
              Training Sessions
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Atlet</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari atlet..."
                  value={athleteSearch}
                  onChange={(e) => setAthleteSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={athleteSortBy} onValueChange={(v: any) => setAthleteSortBy(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Terbaru</SelectItem>
                    <SelectItem value="name">Nama (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Athlete Form */}
            <form onSubmit={handleAddAthlete} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Tambah Atlet Baru</h3>
              <div>
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={athleteForm.name}
                  onChange={(e) => setAthleteForm({ ...athleteForm, name: e.target.value })}
                  required
                />
              </div>
              
              {/* Avatar Upload */}
              <div>
                <Label htmlFor="avatar">Foto Profil</Label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="height">Tinggi (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={athleteForm.bodyHeight}
                    onChange={(e) => setAthleteForm({ ...athleteForm, bodyHeight: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mass">Berat (kg)</Label>
                  <Input
                    id="mass"
                    type="number"
                    value={athleteForm.mass}
                    onChange={(e) => setAthleteForm({ ...athleteForm, mass: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="jump">Lompat (cm)</Label>
                  <Input
                    id="jump"
                    type="number"
                    value={athleteForm.verticalJump}
                    onChange={(e) => setAthleteForm({ ...athleteForm, verticalJump: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sportsBranch">Cabang Olahraga</Label>
                <Input
                  id="sportsBranch"
                  placeholder="Contoh: Bola Voli, Sepak Bola, dll"
                  value={athleteForm.sportsBranch}
                  onChange={(e) => setAthleteForm({ ...athleteForm, sportsBranch: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={athletesLoading || isUploading}>
                {(athletesLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah Atlet
              </Button>
            </form>

            {/* Athletes List */}
            <div className="space-y-2">
              {athletesLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredAthletes.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">
                  {athleteSearch ? "Tidak ada atlet ditemukan" : "Belum ada atlet"}
                </p>
              ) : (
                filteredAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        {athlete.avatar_url ? (
                          <img 
                            src={athlete.avatar_url} 
                            alt={athlete.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{athlete.name}</h3>
                            {athlete.sports_branch && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {athlete.sports_branch}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {athlete.body_height && `Tinggi: ${athlete.body_height}cm`}
                            {athlete.mass && ` | Berat: ${athlete.mass}kg`}
                            {athlete.vertical_jump && ` | Lompat: ${athlete.vertical_jump}cm`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAthlete(athlete)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAthlete(athlete.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Athlete Dialog */}
        <AthleteEditDialog
          athlete={editingAthlete}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={updateAthlete}
        />
      </div>
    </div>
  );
};

export default Profile;
