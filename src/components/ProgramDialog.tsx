import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Flame, Target, Snowflake, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TrainingProgram, ProgramExercise, TrainingProgramInput, CompleteProgramInput } from "@/hooks/useTrainingPrograms";

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  existingProgram?: TrainingProgram;
  athleteId: string;
  onSave: (input: TrainingProgramInput) => void;
  onUpdate: (data: { programId: string; input: Partial<TrainingProgramInput> }) => void;
  onComplete: (input: CompleteProgramInput) => void;
  onDelete: (programId: string) => void;
}

const EXERCISE_TYPES = [
  { value: "strength", label: "Kekuatan (kg)" },
  { value: "speed", label: "Kecepatan (m/s)" },
  { value: "endurance", label: "Daya Tahan (km)" },
  { value: "technique", label: "Teknik (rep)" },
  { value: "tactical", label: "Taktik (rep)" },
];

const ProgramDialog = ({
  open,
  onOpenChange,
  selectedDate,
  existingProgram,
  athleteId,
  onSave,
  onUpdate,
  onComplete,
  onDelete,
}: ProgramDialogProps) => {
  const [programType, setProgramType] = useState<string>("training");
  const [warmUp, setWarmUp] = useState("");
  const [coolingDown, setCoolingDown] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Omit<ProgramExercise, 'id' | 'program_id'>[]>([]);
  
  // Completion form
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedRpe, setCompletedRpe] = useState("");
  const [completedDuration, setCompletedDuration] = useState("");

  // Reset form when dialog opens/closes or program changes
  useEffect(() => {
    if (existingProgram) {
      setProgramType(existingProgram.program_type);
      setWarmUp(existingProgram.warm_up || "");
      setCoolingDown(existingProgram.cooling_down || "");
      setNotes(existingProgram.notes || "");
      setExercises(
        existingProgram.program_exercises?.map((ex) => ({
          exercise_name: ex.exercise_name,
          exercise_type: ex.exercise_type,
          sets: ex.sets,
          reps: ex.reps,
          load_value: ex.load_value,
          order_index: ex.order_index,
        })) || []
      );
      setCompletedRpe(existingProgram.completed_rpe?.toString() || "");
      setCompletedDuration(existingProgram.completed_duration_minutes?.toString() || "");
    } else {
      setProgramType("training");
      setWarmUp("");
      setCoolingDown("");
      setNotes("");
      setExercises([]);
      setCompletedRpe("");
      setCompletedDuration("");
    }
    setIsCompleting(false);
  }, [existingProgram, open]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        exercise_name: "",
        exercise_type: "strength",
        sets: undefined,
        reps: undefined,
        load_value: "",
        order_index: exercises.length,
      },
    ]);
  };

  const updateExercise = (index: number, field: keyof ProgramExercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedDate) return;

    const input: TrainingProgramInput = {
      athlete_id: athleteId,
      program_date: format(selectedDate, "yyyy-MM-dd"),
      program_type: programType,
      warm_up: warmUp || undefined,
      cooling_down: coolingDown || undefined,
      notes: notes || undefined,
      exercises: exercises.filter((ex) => ex.exercise_name.trim() !== ""),
    };

    if (existingProgram) {
      onUpdate({ programId: existingProgram.id, input });
    } else {
      onSave(input);
    }
    onOpenChange(false);
  };

  const handleComplete = () => {
    if (!existingProgram || !completedRpe || !completedDuration) return;

    onComplete({
      program_id: existingProgram.id,
      completed_rpe: parseInt(completedRpe),
      completed_duration_minutes: parseInt(completedDuration),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!existingProgram) return;
    if (confirm("Apakah Anda yakin ingin menghapus program ini?")) {
      onDelete(existingProgram.id);
      onOpenChange(false);
    }
  };

  if (!selectedDate) return null;

  const dayName = format(selectedDate, "EEEE", { locale: id });
  const dateFormatted = format(selectedDate, "d MMMM yyyy", { locale: id });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {dayName}, {dateFormatted}
            </span>
            <div className="flex items-center gap-2">
              {existingProgram?.is_completed && (
                <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                  <Checkbox checked disabled /> SELESAI
                </span>
              )}
              <Select value={programType} onValueChange={setProgramType} disabled={existingProgram?.is_completed}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Latihan</SelectItem>
                  <SelectItem value="rest">Istirahat</SelectItem>
                  <SelectItem value="recovery">Pemulihan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogTitle>
        </DialogHeader>

        {programType !== "rest" ? (
          <div className="space-y-6">
            {/* Warm Up Section */}
            <div>
              <Label className="flex items-center gap-2 text-orange-600 mb-2">
                <Flame className="h-4 w-4" />
                WARM UP
              </Label>
              <Textarea
                placeholder="Contoh: Jogging 10 menit..."
                value={warmUp}
                onChange={(e) => setWarmUp(e.target.value)}
                disabled={existingProgram?.is_completed}
              />
            </div>

            {/* Main Set Section */}
            <div>
              <Label className="flex items-center gap-2 text-red-600 mb-2">
                <Target className="h-4 w-4" />
                MAIN SET
              </Label>
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Nama Latihan"
                      value={exercise.exercise_name}
                      onChange={(e) => updateExercise(index, "exercise_name", e.target.value)}
                      className="flex-1"
                      disabled={existingProgram?.is_completed}
                    />
                    <Select
                      value={exercise.exercise_type}
                      onValueChange={(v) => updateExercise(index, "exercise_type", v)}
                      disabled={existingProgram?.is_completed}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXERCISE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Set"
                      type="number"
                      value={exercise.sets || ""}
                      onChange={(e) => updateExercise(index, "sets", parseInt(e.target.value) || undefined)}
                      className="w-16"
                      disabled={existingProgram?.is_completed}
                    />
                    <Input
                      placeholder="Rep"
                      type="number"
                      value={exercise.reps || ""}
                      onChange={(e) => updateExercise(index, "reps", parseInt(e.target.value) || undefined)}
                      className="w-16"
                      disabled={existingProgram?.is_completed}
                    />
                    <Input
                      placeholder="Beban/Jarak"
                      value={exercise.load_value || ""}
                      onChange={(e) => updateExercise(index, "load_value", e.target.value)}
                      className="w-24"
                      disabled={existingProgram?.is_completed}
                    />
                    {!existingProgram?.is_completed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {!existingProgram?.is_completed && (
                  <Button variant="default" size="sm" onClick={addExercise}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                )}
              </div>
            </div>

            {/* Cooling Down Section */}
            <div>
              <Label className="flex items-center gap-2 text-blue-600 mb-2">
                <Snowflake className="h-4 w-4" />
                COOLING DOWN
              </Label>
              <Textarea
                placeholder="Contoh: Static stretching..."
                value={coolingDown}
                onChange={(e) => setCoolingDown(e.target.value)}
                disabled={existingProgram?.is_completed}
              />
            </div>

            {/* Recovery & Notes Section */}
            <div>
              <Label className="flex items-center gap-2 text-green-600 mb-2">
                <Sparkles className="h-4 w-4" />
                RECOVERY & NOTES
              </Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-green-200 focus:border-green-400"
                disabled={existingProgram?.is_completed}
              />
            </div>

            {/* Completion Section - Only show for existing programs that are not completed */}
            {existingProgram && !existingProgram.is_completed && (
              <div className="border-t pt-4">
                <Label className="text-lg font-semibold mb-4 block">Selesaikan Program</Label>
                {!isCompleting ? (
                  <Button onClick={() => setIsCompleting(true)} className="w-full">
                    Tandai Selesai & Isi RPE
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="completed-rpe">RPE (1-10)</Label>
                        <Input
                          id="completed-rpe"
                          type="number"
                          min="1"
                          max="10"
                          value={completedRpe}
                          onChange={(e) => setCompletedRpe(e.target.value)}
                          placeholder="1-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="completed-duration">Durasi (menit)</Label>
                        <Input
                          id="completed-duration"
                          type="number"
                          value={completedDuration}
                          onChange={(e) => setCompletedDuration(e.target.value)}
                          placeholder="60"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleComplete} disabled={!completedRpe || !completedDuration}>
                        Simpan & Selesaikan
                      </Button>
                      <Button variant="outline" onClick={() => setIsCompleting(false)}>
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show completion data for completed programs */}
            {existingProgram?.is_completed && (
              <div className="border-t pt-4 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <Label className="text-lg font-semibold mb-2 block text-green-700 dark:text-green-300">
                  Data Penyelesaian
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">RPE:</span>
                    <span className="ml-2 font-semibold">{existingProgram.completed_rpe}/10</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Durasi:</span>
                    <span className="ml-2 font-semibold">{existingProgram.completed_duration_minutes} menit</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-lg">Hari Istirahat</p>
            <p className="text-sm mt-2">Tidak ada program latihan untuk hari ini</p>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {existingProgram && !existingProgram.is_completed && (
              <Button variant="destructive" onClick={handleDelete}>
                Hapus Program
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            {!existingProgram?.is_completed && (
              <Button onClick={handleSave}>
                {existingProgram ? "Perbarui" : "Simpan"} Program
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramDialog;
