import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Activity, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

interface AthleteReadinessFormProps {
  athleteId: string;
  onSubmit: (data: {
    athlete_id: string;
    readiness_date: string;
    resting_heart_rate: number;
    vertical_jump: number;
  }) => void;
  isSubmitting?: boolean;
}

export function AthleteReadinessForm({ athleteId, onSubmit, isSubmitting }: AthleteReadinessFormProps) {
  const [restingHeartRate, setRestingHeartRate] = useState<string>("");
  const [verticalJump, setVerticalJump] = useState<string>("");
  const today = format(new Date(), "yyyy-MM-dd");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rhr = parseInt(restingHeartRate);
    const vj = parseFloat(verticalJump);
    
    if (!restingHeartRate || !verticalJump) {
      toast.error("Mohon isi semua field");
      return;
    }
    
    if (isNaN(rhr) || rhr < 30 || rhr > 220) {
      toast.error("Heart rate harus antara 30-220 bpm");
      return;
    }
    
    if (isNaN(vj) || vj <= 0 || vj > 200) {
      toast.error("Vertical jump harus antara 1-200 cm");
      return;
    }
    
    onSubmit({
      athlete_id: athleteId,
      readiness_date: today,
      resting_heart_rate: rhr,
      vertical_jump: vj,
    });
    
    // Reset form after submission
    setRestingHeartRate("");
    setVerticalJump("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Input Kesiapan Harian
        </CardTitle>
        <CardDescription>
          Catat data kesiapan Anda hari ini ({format(new Date(), "EEEE, d MMMM yyyy", { locale: id })})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rhr" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Resting Heart Rate (bpm)
              </Label>
              <Input
                id="rhr"
                type="number"
                placeholder="Contoh: 60"
                value={restingHeartRate}
                onChange={(e) => setRestingHeartRate(e.target.value)}
                min={30}
                max={220}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Ukur saat bangun tidur sebelum beraktivitas
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vj" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Vertical Jump (cm)
              </Label>
              <Input
                id="vj"
                type="number"
                placeholder="Contoh: 45"
                value={verticalJump}
                onChange={(e) => setVerticalJump(e.target.value)}
                min={1}
                max={200}
                step="0.1"
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Lakukan 3x percobaan dan ambil yang terbaik
              </p>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Panduan Pengukuran:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Ukur heart rate saat pertama kali bangun, sebelum bergerak dari tempat tidur</li>
              <li>Gunakan pulse oximeter atau smartwatch untuk hasil akurat</li>
              <li>Vertical jump diukur dengan counter movement jump</li>
              <li>Lakukan pemanasan ringan 5 menit sebelum tes vertical jump</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !restingHeartRate || !verticalJump}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Simpan Data Kesiapan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
