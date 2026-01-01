import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Athlete {
  id: string;
  user_id: string;
  name: string;
  mass: number | null;
  body_height: number | null;
  vertical_jump: number | null;
  avatar_url: string | null;
  sports_branch: string | null;
  created_at: string;
  updated_at: string;
}

interface AthleteEditDialogProps {
  athlete: Athlete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: Partial<Athlete> & { id: string }) => void;
}

export function AthleteEditDialog({ athlete, open, onOpenChange, onUpdate }: AthleteEditDialogProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    mass: "",
    body_height: "",
    vertical_jump: "",
    sports_branch: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (athlete) {
      setForm({
        name: athlete.name,
        mass: athlete.mass?.toString() || "",
        body_height: athlete.body_height?.toString() || "",
        vertical_jump: athlete.vertical_jump?.toString() || "",
        sports_branch: athlete.sports_branch || "",
      });
      setAvatarPreview(athlete.avatar_url);
      setAvatarFile(null);
    }
  }, [athlete]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete || !user) return;

    setIsUploading(true);

    try {
      let avatarUrl = athlete.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('athlete-avatars')
          .upload(fileName, avatarFile);

        if (uploadError) {
          toast.error("Gagal mengunggah foto: " + uploadError.message);
          setIsUploading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('athlete-avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      onUpdate({
        id: athlete.id,
        name: form.name,
        mass: form.mass ? Number(form.mass) : null,
        body_height: form.body_height ? Number(form.body_height) : null,
        vertical_jump: form.vertical_jump ? Number(form.vertical_jump) : null,
        avatar_url: avatarUrl,
        sports_branch: form.sports_branch || null,
      });

      onOpenChange(false);
      toast.success("Data atlet berhasil diperbarui");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Gagal memperbarui data atlet");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Atlet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <label
                htmlFor="edit-avatar"
                className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-8 w-8 text-primary" />
              </label>
              <Input
                id="edit-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">Klik foto untuk mengubah</p>
          </div>

          <div>
            <Label htmlFor="edit-name">Nama</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-sports-branch">Cabang Olahraga</Label>
            <Input
              id="edit-sports-branch"
              placeholder="Contoh: Bola Voli, Sepak Bola, dll"
              value={form.sports_branch}
              onChange={(e) => setForm({ ...form, sports_branch: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="edit-height">Tinggi (cm)</Label>
              <Input
                id="edit-height"
                type="number"
                value={form.body_height}
                onChange={(e) => setForm({ ...form, body_height: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-mass">Berat (kg)</Label>
              <Input
                id="edit-mass"
                type="number"
                value={form.mass}
                onChange={(e) => setForm({ ...form, mass: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-jump">Lompat (cm)</Label>
              <Input
                id="edit-jump"
                type="number"
                value={form.vertical_jump}
                onChange={(e) => setForm({ ...form, vertical_jump: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
