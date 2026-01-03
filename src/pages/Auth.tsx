import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { authSchema } from "@/lib/validationSchemas";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("athlete");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = authSchema.parse({ email, password });

      if (isLogin) {
        await signIn(validatedData.email, validatedData.password);
        toast.success("Berhasil masuk!");
        navigate("/app");
      } else {
        await signUp(validatedData.email, validatedData.password);
        
        // Wait a moment for the user to be created, then get the session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Assign the selected role to the new user
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: session.user.id,
              role: selectedRole,
            });

          if (roleError) {
            console.error("Error assigning role:", roleError);
          }
        }
        
        toast.success("Akun berhasil dibuat!");
        navigate("/app");
      }
    } catch (error: any) {
      if (error.name === "ZodError") {
        toast.error(error.errors[0]?.message || "Data tidak valid");
      } else if (error.message?.includes("User already registered")) {
        toast.error("Email sudah terdaftar. Silakan login.");
        setIsLogin(true);
      } else {
        toast.error(error.message || "Terjadi kesalahan. Silakan coba lagi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center overflow-hidden">
              <img
                src="/hiro-logo.png"
                alt="HIROCROSS Logo"
                className="w-11 h-11 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">HIROCROSS</h1>
          </div>

          <h2 className="text-xl font-semibold text-slate-100 mb-6 text-center">
            {isLogin ? "Masuk" : "Daftar Akun Baru"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="role" className="text-slate-300">
                  Daftar Sebagai
                </Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger id="role" className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">
                      <div className="flex items-center gap-2">
                        <span>🏋️</span>
                        <span>Pelatih (Coach)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="athlete">
                      <div className="flex items-center gap-2">
                        <span>🏃</span>
                        <span>Atlet</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedRole === "coach" 
                    ? "Pelatih dapat membuat dan mengelola program latihan untuk banyak atlet"
                    : "Atlet dapat melihat dan menyelesaikan program latihan yang diberikan pelatih"}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              {isLogin
                ? "Belum punya akun? Daftar"
                : "Sudah punya akun? Masuk"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
