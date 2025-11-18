import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function AdminAccessCodeForm() {
  const [code, setCode] = useState("");
  const [role, setRole] = useState<AppRole>("athlete");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        throw new Error("No access token");
      }

      const { data, error } = await supabase.functions.invoke("verify-admin-access", {
        body: { code, requestedRole: role },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Success",
          description: data.roleAssigned 
            ? `Role ${role} has been assigned to your account`
            : data.message,
        });
        setCode("");
        // Trigger refetch of user roles by refreshing
        window.location.reload();
      } else {
        toast({
          title: "Invalid Code",
          description: data.message || "The access code you entered is incorrect",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error verifying access code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify access code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Role Access</CardTitle>
        <CardDescription>
          Enter the access code to request a specific role (owner, coach, or athlete)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="athlete">Athlete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
