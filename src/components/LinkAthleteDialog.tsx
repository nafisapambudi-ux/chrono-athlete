import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link2, Link2Off, Loader2, User, Mail } from "lucide-react";
import type { Athlete } from "@/hooks/useAthletes";

const emailSchema = z.string().trim().email({ message: "Format email tidak valid" });

interface LinkAthleteDialogProps {
  athlete: Athlete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LinkAthleteDialog({ athlete, open, onOpenChange, onSuccess }: LinkAthleteDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Fetch linked user email when dialog opens and athlete is linked
  useEffect(() => {
    const fetchLinkedEmail = async () => {
      if (!athlete?.linked_user_id || !open) {
        setLinkedEmail(null);
        return;
      }

      setLoadingEmail(true);
      try {
        const { data, error } = await supabase.rpc('get_user_email', {
          user_id_param: athlete.linked_user_id
        });

        if (error) throw error;
        setLinkedEmail(data);
      } catch (error) {
        console.error("Failed to fetch linked email:", error);
        setLinkedEmail(null);
      } finally {
        setLoadingEmail(false);
      }
    };

    fetchLinkedEmail();
  }, [athlete?.linked_user_id, open]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!athlete) return;

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("link-athlete-to-user", {
        body: { email: result.data, athleteId: athlete.id },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || "Berhasil menghubungkan atlet ke akun");
        setEmail("");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghubungkan atlet");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!athlete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("athletes")
        .update({ linked_user_id: null })
        .eq("id", athlete.id);

      if (error) throw error;

      toast.success("Berhasil memutus hubungan akun");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal memutus hubungan akun");
    } finally {
      setLoading(false);
    }
  };

  if (!athlete) return null;

  const isLinked = !!athlete.linked_user_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Hubungkan Atlet ke Akun
          </DialogTitle>
          <DialogDescription>
            Hubungkan profil atlet ke akun user agar atlet dapat melihat program latihan mereka.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-4">
          {athlete.avatar_url ? (
            <img 
              src={athlete.avatar_url} 
              alt={athlete.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium">{athlete.name}</p>
            <p className="text-sm text-muted-foreground">
              {athlete.sports_branch || "Cabang olahraga belum diisi"}
            </p>
          </div>
        </div>

        {isLinked ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400">
                Atlet ini sudah terhubung ke akun user.
              </p>
              {loadingEmail ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Memuat email...</span>
                </div>
              ) : linkedEmail ? (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{linkedEmail}</span>
                </div>
              ) : null}
            </div>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleUnlink}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2Off className="h-4 w-4 mr-2" />
              )}
              Putuskan Hubungan
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="athlete-email">Email Akun Atlet</Label>
              <Input
                id="athlete-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atlet@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Masukkan email akun yang terdaftar sebagai atlet.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Hubungkan Atlet
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
