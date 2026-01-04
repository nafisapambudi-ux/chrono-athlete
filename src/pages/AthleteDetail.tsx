import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useAthleteReadiness } from "@/hooks/useAthleteReadiness";
import { useTrainingPrograms } from "@/hooks/useTrainingPrograms";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useTrainingStats } from "@/hooks/useTrainingStats";
import { AthleteProfileCard } from "@/components/AthleteProfileCard";
import { TrainingStatsCards } from "@/components/TrainingStatsCards";
import { ReadinessStatsCard, getReadinessStatsForAI } from "@/components/ReadinessStatsCard";
import { ReadinessHistoryTable } from "@/components/ReadinessHistoryTable";
import { FitnessFatigueFormChart } from "@/components/FitnessFatigueFormChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Dumbbell, 
  Activity, 
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export default function AthleteDetail() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { athletes, isLoading: athletesLoading } = useAthletes();
  const { readinessData, isLoading: readinessLoading } = useAthleteReadiness(athleteId);
  const { programs, isLoading: programsLoading } = useTrainingPrograms(athleteId);
  const { sessions, isLoading: sessionsLoading } = useTrainingSessions(athleteId);
  const { data: stats, isLoading: statsLoading } = useTrainingStats(athleteId);

  const athlete = athletes.find(a => a.id === athleteId);
  const isLoading = athletesLoading || readinessLoading || programsLoading || sessionsLoading || statsLoading;

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Atlet tidak ditemukan</h1>
          <Button onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Profil
          </Button>
        </div>
      </div>
    );
  }

  // Prepare readiness stats for charts
  const readinessStatsForAI = readinessData.length > 0 ? getReadinessStatsForAI(readinessData) : undefined;

  // Sort programs by date
  const sortedPrograms = [...programs].sort(
    (a, b) => new Date(b.program_date).getTime() - new Date(a.program_date).getTime()
  );

  // Sort sessions by date  
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  const completedPrograms = programs.filter(p => p.is_completed);
  const pendingPrograms = programs.filter(p => !p.is_completed);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{athlete.name}</h1>
              <p className="text-sm text-muted-foreground">Detail & Riwayat Latihan</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/training")}>
              <Dumbbell className="h-4 w-4 mr-2" />
              Training
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <AthleteProfileCard athlete={athlete} />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{programs.length}</p>
              <p className="text-xs text-muted-foreground">Program Latihan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold">{completedPrograms.length}</p>
              <p className="text-xs text-muted-foreground">Selesai</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sesi Latihan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{readinessData.length}</p>
              <p className="text-xs text-muted-foreground">Data Kesiapan</p>
            </CardContent>
          </Card>
        </div>

        {/* Training Stats */}
        {stats && <TrainingStatsCards stats={stats} />}

        {/* Tabs for different sections */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performa</TabsTrigger>
            <TabsTrigger value="programs">Program ({programs.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sesi ({sessions.length})</TabsTrigger>
            <TabsTrigger value="readiness">Kesiapan ({readinessData.length})</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            {readinessData.length > 0 && (
              <ReadinessStatsCard readinessData={readinessData} />
            )}
            
            {sessions.length > 0 && (
              <FitnessFatigueFormChart 
                sessions={sessions}
                athleteName={athlete.name}
                readinessStats={readinessStatsForAI}
              />
            )}

            {sessions.length === 0 && readinessData.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data performa</p>
                  <p className="text-sm">Tambahkan sesi latihan atau data kesiapan untuk melihat analisis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Riwayat Program Latihan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedPrograms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada program latihan
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sortedPrograms.map((program) => (
                      <div 
                        key={program.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {format(parseISO(program.program_date), "dd MMMM yyyy", { locale: id })}
                              </span>
                              <Badge variant={program.is_completed ? "default" : "secondary"}>
                                {program.is_completed ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Selesai
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {program.program_type}
                              </Badge>
                            </div>
                            
                            {program.is_completed && (
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                {program.completed_rpe && (
                                  <span>RPE: {program.completed_rpe}</span>
                                )}
                                {program.completed_duration_minutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {program.completed_duration_minutes} menit
                                  </span>
                                )}
                              </div>
                            )}

                            {program.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {program.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Riwayat Sesi Latihan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada sesi latihan
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sortedSessions.map((session) => (
                      <div 
                        key={session.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">
                              {format(parseISO(session.session_date), "dd MMMM yyyy", { locale: id })}
                            </span>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.duration_minutes} menit
                              </span>
                              <span>RPE: {session.rpe}/10</span>
                            </div>
                            {session.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {session.notes}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={session.rpe >= 8 ? "destructive" : session.rpe >= 5 ? "default" : "secondary"}
                          >
                            RPE {session.rpe}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Readiness Tab */}
          <TabsContent value="readiness" className="mt-6">
            <ReadinessHistoryTable 
              readinessData={readinessData}
              athleteName={athlete.name}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
