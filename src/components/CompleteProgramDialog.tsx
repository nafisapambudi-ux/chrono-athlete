import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Dumbbell, Loader2 } from "lucide-react";
import { TrainingProgram } from "@/hooks/useTrainingPrograms";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { calculateTrainingLoad, RPE_DESCRIPTIONS, RPE_BASE_LOAD } from "@/lib/trainingLoadUtils";

interface CompleteProgramDialogProps {
  program: TrainingProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: { program_id: string; completed_rpe: number; completed_duration_minutes: number }) => void;
  isSubmitting?: boolean;
}

export function CompleteProgramDialog({
  program,
  open,
  onOpenChange,
  onComplete,
  isSubmitting,
}: CompleteProgramDialogProps) {
  const [rpe, setRpe] = useState<number>(5);
  const [duration, setDuration] = useState<string>("60");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!program) return;
    
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 480) {
      return;
    }

    onComplete({
      program_id: program.id,
      completed_rpe: rpe,
      completed_duration_minutes: durationNum,
    });
  };

  if (!program) return null;

  const rpeInfo = RPE_DESCRIPTIONS[rpe];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Selesaikan Latihan
          </DialogTitle>
          <DialogDescription>
            Catat RPE dan durasi latihan Anda untuk program ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Program Info */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4" />
              <span className="font-medium capitalize">{program.program_type}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(program.program_date), "EEEE, d MMMM yyyy", { locale: id })}
            </p>
            {program.program_exercises && program.program_exercises.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Latihan:</p>
                <div className="flex flex-wrap gap-1">
                  {program.program_exercises.map((ex, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {ex.exercise_name || ex.exercise_type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* RPE Slider */}
            <div className="space-y-4">
              <Label>Rating of Perceived Exertion (RPE)</Label>
              <div className="space-y-3">
                <Slider
                  value={[rpe]}
                  onValueChange={(values) => setRpe(values[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{rpe}</span>
                  <Badge className={`${rpeInfo.color} text-white`}>
                    {rpeInfo.label}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 - Sangat Ringan</span>
                  <span>10 - Maksimal</span>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durasi Latihan (menit)
              </Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={1}
                max={480}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Total waktu latihan dari warm-up hingga cooling down
              </p>
            </div>

            {/* Training Load Preview */}
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Perkiraan Training Load</p>
              <p className="text-2xl font-bold text-primary">
                {calculateTrainingLoad(rpe, parseInt(duration || "0"))} TSS
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                RPE {rpe} (base: {RPE_BASE_LOAD[rpe]}/60 menit) × {duration || 0} menit
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !duration}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Selesai
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
