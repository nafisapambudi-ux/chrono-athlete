import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrainingProgram } from "@/hooks/useTrainingPrograms";
import { 
  Dumbbell, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Flame,
  Activity,
  MessageSquare,
  ListChecks
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { calculateTrainingLoad, RPE_DESCRIPTIONS, RPE_BASE_LOAD } from "@/lib/trainingLoadUtils";

interface ProgramDetailDialogProps {
  program: TrainingProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  showCompleteButton?: boolean;
}

export function ProgramDetailDialog({
  program,
  open,
  onOpenChange,
  onComplete,
  showCompleteButton = true,
}: ProgramDetailDialogProps) {
  if (!program) return null;

  const trainingLoad = program.completed_rpe && program.completed_duration_minutes
    ? calculateTrainingLoad(program.completed_rpe, program.completed_duration_minutes)
    : null;

  const rpeInfo = program.completed_rpe ? RPE_DESCRIPTIONS[program.completed_rpe] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Detail Program Latihan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(program.program_date), "EEEE, d MMMM yyyy", { locale: id })}
              </span>
            </div>
            <Badge variant={program.is_completed ? "default" : "secondary"}>
              {program.is_completed ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Selesai</>
              ) : (
                <><Clock className="h-3 w-3 mr-1" /> Pending</>
              )}
            </Badge>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="font-semibold capitalize text-lg">{program.program_type}</p>
          </div>

          {/* Warm Up */}
          {program.warm_up && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-orange-500" />
                Pemanasan
              </h4>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{program.warm_up}</p>
              </div>
            </div>
          )}

          {/* Exercises */}
          {program.program_exercises && program.program_exercises.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                <ListChecks className="h-4 w-4 text-primary" />
                Latihan Inti
              </h4>
              <div className="space-y-2">
                {program.program_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((exercise, idx) => (
                    <div 
                      key={exercise.id || idx}
                      className="bg-primary/5 border border-primary/10 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium">{exercise.exercise_name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {exercise.exercise_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {exercise.sets && (
                          <span className="px-2 py-1 bg-muted rounded">
                            {exercise.sets} Set
                          </span>
                        )}
                        {exercise.reps && (
                          <span className="px-2 py-1 bg-muted rounded">
                            {exercise.reps} Rep
                          </span>
                        )}
                        {exercise.load_value && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Load: {exercise.load_value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cooling Down */}
          {program.cooling_down && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-blue-500" />
                Pendinginan
              </h4>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{program.cooling_down}</p>
              </div>
            </div>
          )}

          {/* Notes from Coach */}
          {program.notes && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Catatan dari Pelatih
              </h4>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{program.notes}</p>
              </div>
            </div>
          )}

          {/* Completion Stats */}
          {program.is_completed && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Hasil Latihan</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{program.completed_rpe}</p>
                    <p className="text-xs text-muted-foreground">RPE</p>
                    {rpeInfo && (
                      <Badge className={`${rpeInfo.color} text-white text-xs mt-1`}>
                        {rpeInfo.label}
                      </Badge>
                    )}
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{program.completed_duration_minutes}</p>
                    <p className="text-xs text-muted-foreground">Menit</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{trainingLoad}</p>
                    <p className="text-xs text-muted-foreground">Training Load</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Load dihitung berdasarkan RPE {program.completed_rpe} (base: {RPE_BASE_LOAD[program.completed_rpe || 1]}/60 menit) × {program.completed_duration_minutes} menit
                </p>
              </div>
            </>
          )}

          {/* Complete Button */}
          {!program.is_completed && showCompleteButton && onComplete && (
            <>
              <Separator />
              <Button className="w-full" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Selesaikan Latihan Ini
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
