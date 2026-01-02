import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Plus, Check, Dumbbell } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { TrainingProgram } from "@/hooks/useTrainingPrograms";
import { cn } from "@/lib/utils";

interface TrainingCalendarProps {
  programs: TrainingProgram[];
  onDayClick: (date: Date, program?: TrainingProgram) => void;
  selectedAthleteId: string | null;
}

const DAYS_OF_WEEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const TrainingCalendar = ({ programs, onDayClick, selectedAthleteId }: TrainingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  // We want Monday to be first, so adjust
  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Create weeks array
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Add empty cells for days before the start of the month
    for (let i = 0; i < adjustedStartDay; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    daysInMonth.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Fill remaining days in the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      result.push(currentWeek);
    }

    return result;
  }, [daysInMonth, adjustedStartDay]);

  // Get program for a specific date
  const getProgramForDate = (date: Date): TrainingProgram | undefined => {
    return programs.find((p) => isSameDay(new Date(p.program_date), date));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(direction === "prev" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  const getWeekNumber = (weekIndex: number): number => {
    // Calculate week number based on the first day with data in that week
    const firstDayOfWeek = weeks[weekIndex].find((d) => d !== null);
    if (!firstDayOfWeek) return weekIndex + 1;
    
    const weekOfMonth = Math.ceil(firstDayOfWeek.getDate() / 7);
    return weekOfMonth;
  };

  if (!selectedAthleteId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalender Program Latihan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center p-8">
            Pilih atlet untuk melihat kalender program latihan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalender Program Latihan
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="text-center text-sm font-semibold text-muted-foreground p-2">Minggu</div>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-1">
              {/* Week indicator */}
              <div className="p-2 rounded-lg bg-primary/10 border-l-4 border-primary">
                <div className="text-sm font-bold text-primary">W{getWeekNumber(weekIndex)}</div>
              </div>

              {/* Days */}
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${dayIndex}`} className="p-2 min-h-[80px]" />;
                }

                const program = getProgramForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 min-h-[80px] rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                      isToday && "ring-2 ring-primary",
                      program?.is_completed && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
                      program && !program.is_completed && "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
                      program?.program_type === "rest" && "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
                    )}
                    onClick={() => onDayClick(day, program)}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                        {format(day, "d")}
                      </span>
                      {program ? (
                        program.is_completed ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Dumbbell className="h-4 w-4 text-blue-600" />
                        )
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                    {program && (
                      <div className="mt-1">
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          program.program_type === "rest" 
                            ? "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300" 
                            : program.is_completed
                              ? "bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300"
                              : "bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                        )}>
                          {program.program_type === "rest" ? "Istirahat" : 
                           program.is_completed ? "Selesai" : "Latihan"}
                        </span>
                        {program.is_completed && program.completed_rpe && (
                          <div className="text-xs text-muted-foreground mt-1">
                            RPE: {program.completed_rpe}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-800" />
            <span>Program Tersedia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-800" />
            <span>Selesai</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800" />
            <span>Istirahat</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingCalendar;
