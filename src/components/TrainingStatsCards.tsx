import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Zap, Timer, Target, Shield } from "lucide-react";
import type { TrainingStats } from "@/hooks/useTrainingStats";

interface TrainingStatsCardsProps {
  stats: TrainingStats;
  isLoading?: boolean;
}

export function TrainingStatsCards({ stats, isLoading }: TrainingStatsCardsProps) {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} ton`;
    }
    return `${kg.toFixed(0)} kg`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-slate-700 rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-700 rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Total Beban
          </CardTitle>
          <Dumbbell className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-orange-400">
            {formatWeight(stats.totalWeightLifted)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Latihan Kekuatan</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Jarak Sprint
          </CardTitle>
          <Zap className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-yellow-400">
            {formatDistance(stats.totalSprintDistance)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Latihan Kecepatan</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Jarak Endurance
          </CardTitle>
          <Timer className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-blue-400">
            {formatDistance(stats.totalEnduranceDistance)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Latihan Daya Tahan</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Repetisi Teknik
          </CardTitle>
          <Target className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-green-400">
            {stats.totalTechniqueReps.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Latihan Teknik</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Repetisi Taktik
          </CardTitle>
          <Shield className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-purple-400">
            {stats.totalTacticsReps.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Latihan Taktik</p>
        </CardContent>
      </Card>
    </div>
  );
}
