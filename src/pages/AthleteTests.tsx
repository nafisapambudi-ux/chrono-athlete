import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAthletes } from "@/hooks/useAthletes";
import { useAthleteTests } from "@/hooks/useAthleteTests";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, ClipboardList, User, Calendar } from "lucide-react";
import { TestInputDialog } from "@/components/TestInputDialog";
import { TestResultsCard } from "@/components/TestResultsCard";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Gender } from "@/lib/testNorms";

const AthleteTests = () => {
  const navigate = useNavigate();
  const { athleteId: urlAthleteId } = useParams();
  const { user } = useAuth();
  const { data: roles } = useUserRole(user?.id);
  const { athletes, isLoading: athletesLoading } = useAthletes();
  
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(urlAthleteId || "");
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const isCoach = roles?.includes("coach") || roles?.includes("owner");

  // Fetch athlete details including gender and birth_date
  const { data: athleteDetails } = useQuery({
    queryKey: ["athlete_details", selectedAthleteId],
    queryFn: async () => {
      if (!selectedAthleteId) return null;
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .eq("id", selectedAthleteId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAthleteId,
  });

  const {
    tests,
    testsByCategory,
    latestTests,
    isLoading: testsLoading,
    createMultipleTests,
    deleteTest,
    isCreating,
  } = useAthleteTests(selectedAthleteId);

  const selectedAthlete = useMemo(() => {
    return athletes.find(a => a.id === selectedAthleteId) || null;
  }, [athletes, selectedAthleteId]);

  const athleteGender = athleteDetails?.gender as Gender | null;
  const athleteBirthDate = athleteDetails?.birth_date 
    ? new Date(athleteDetails.birth_date) 
    : null;

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-7 w-7" />
                Tes & Pengukuran
              </h1>
              <p className="text-muted-foreground text-sm">
                Kelola hasil tes bimotor atlet
              </p>
            </div>
          </div>

          {isCoach && selectedAthleteId && (
            <Button onClick={() => setTestDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Input Tes Baru
            </Button>
          )}
        </header>

        {/* Athlete Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Pilih Atlet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Select 
                  value={selectedAthleteId} 
                  onValueChange={setSelectedAthleteId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih atlet untuk melihat hasil tes" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAthlete && (
                <div className="flex flex-wrap gap-3 items-center text-sm text-muted-foreground">
                  {athleteGender && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {athleteGender === "male" ? "Laki-laki" : "Perempuan"}
                    </span>
                  )}
                  {athleteBirthDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(athleteBirthDate, "d MMMM yyyy", { locale: id })}
                    </span>
                  )}
                  {selectedAthlete.mass && (
                    <span>BB: {selectedAthlete.mass} kg</span>
                  )}
                  {selectedAthlete.body_height && (
                    <span>TB: {selectedAthlete.body_height} cm</span>
                  )}
                </div>
              )}
            </div>

            {selectedAthleteId && (!athleteGender || !athleteBirthDate) && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠️ Data gender dan/atau tanggal lahir atlet belum diisi. 
                  Norma tes tidak dapat ditampilkan dengan akurat.
                  {isCoach && (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto ml-1 text-yellow-700 dark:text-yellow-400 underline"
                      onClick={() => navigate(`/athlete/${selectedAthleteId}`)}
                    >
                      Edit profil atlet
                    </Button>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {selectedAthleteId && (
          <TestResultsCard
            tests={tests}
            testsByCategory={testsByCategory}
            latestTests={latestTests}
            athleteGender={athleteGender}
            athleteBirthDate={athleteBirthDate}
            athleteMass={selectedAthlete?.mass || null}
            onDeleteTest={isCoach ? deleteTest : undefined}
            isCoach={isCoach}
          />
        )}

        {/* Test Input Dialog */}
        <TestInputDialog
          open={testDialogOpen}
          onOpenChange={setTestDialogOpen}
          athlete={selectedAthlete}
          athleteGender={athleteGender}
          athleteBirthDate={athleteBirthDate}
          onSubmit={createMultipleTests}
          isSubmitting={isCreating}
        />
      </div>
    </div>
  );
};

export default AthleteTests;
