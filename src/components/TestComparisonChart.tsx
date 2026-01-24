import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { BarChart3, Target, Users } from "lucide-react";
import {
  testCategories,
  TestCategory,
  getNormLevel,
  normLevelLabels,
  getAgeGroup,
  calculateAge,
  Gender,
} from "@/lib/testNorms";
import type { AthleteTest } from "@/hooks/useAthleteTests";

interface AthleteInfo {
  id: string;
  name: string;
  gender: Gender | null;
  birthDate: Date | null;
  mass: number | null;
}

interface TestComparisonChartProps {
  athletes: AthleteInfo[];
  athleteTests: Record<string, AthleteTest[]>;
  selectedAthleteIds: string[];
  onAthleteSelect: (ids: string[]) => void;
}

// Chart colors for different athletes
const ATHLETE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(320, 70%, 50%)",
];

export function TestComparisonChart({
  athletes,
  athleteTests,
  selectedAthleteIds,
  onAthleteSelect,
}: TestComparisonChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>("strength");
  const [chartType, setChartType] = useState<"bar" | "radar">("bar");

  // Get latest test for each athlete and test name
  const getLatestTests = (athleteId: string, category: TestCategory) => {
    const tests = athleteTests[athleteId] || [];
    const categoryTests = tests.filter(t => t.test_category === category);
    
    // Get latest test for each test_name
    const latestByName: Record<string, AthleteTest> = {};
    categoryTests.forEach(test => {
      if (!latestByName[test.test_name] || 
          new Date(test.test_date) > new Date(latestByName[test.test_name].test_date)) {
        latestByName[test.test_name] = test;
      }
    });
    
    return latestByName;
  };

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    if (selectedAthleteIds.length === 0) return [];

    // Get all unique test names across selected athletes
    const allTestNames = new Set<string>();
    selectedAthleteIds.forEach(athleteId => {
      const latestTests = getLatestTests(athleteId, selectedCategory);
      Object.keys(latestTests).forEach(name => allTestNames.add(name));
    });

    // Build data for each test
    return Array.from(allTestNames).map(testName => {
      const testInfo = testCategories[selectedCategory].tests.find(t => t.id === testName);
      if (!testInfo) return null;

      const dataPoint: Record<string, any> = {
        testName: testInfo.name,
        testId: testName,
        unit: testInfo.unit,
      };

      selectedAthleteIds.forEach((athleteId, index) => {
        const athlete = athletes.find(a => a.id === athleteId);
        const latestTests = getLatestTests(athleteId, selectedCategory);
        const test = latestTests[testName];

        if (test && athlete) {
          let value = test.result_value;
          
          // For 1RM tests, calculate relative to body weight
          if (testInfo.isRelativeToBodyWeight && test.body_weight_at_test) {
            value = test.result_value / test.body_weight_at_test;
          }

          dataPoint[`athlete_${index}`] = Number(value.toFixed(2));
          dataPoint[`athlete_${index}_name`] = athlete.name;
          dataPoint[`athlete_${index}_raw`] = test.result_value;
          dataPoint[`athlete_${index}_bodyWeight`] = test.body_weight_at_test;

          // Get norm level if possible
          if (athlete.gender && athlete.birthDate) {
            const age = calculateAge(athlete.birthDate);
            const ageGroup = getAgeGroup(age);
            const normLevel = getNormLevel(testName, value, athlete.gender, ageGroup, testInfo.higherIsBetter);
            dataPoint[`athlete_${index}_norm`] = normLevelLabels[normLevel];
          }
        }
      });

      return dataPoint;
    }).filter(Boolean);
  }, [selectedAthleteIds, selectedCategory, athleteTests, athletes]);

  // Prepare radar chart data (normalized 0-100)
  const radarData = useMemo(() => {
    if (selectedAthleteIds.length === 0 || comparisonData.length === 0) return [];

    return comparisonData.map(item => {
      if (!item) return null;
      
      const dataPoint: Record<string, any> = {
        subject: item.testName,
      };

      // Find max value for normalization
      const values = selectedAthleteIds.map((_, index) => item[`athlete_${index}`] || 0);
      const maxValue = Math.max(...values, 1);

      selectedAthleteIds.forEach((athleteId, index) => {
        const athlete = athletes.find(a => a.id === athleteId);
        const value = item[`athlete_${index}`] || 0;
        // Normalize to 0-100 for radar
        dataPoint[athlete?.name || `Athlete ${index + 1}`] = Math.round((value / maxValue) * 100);
      });

      return dataPoint;
    }).filter(Boolean);
  }, [comparisonData, selectedAthleteIds, athletes]);

  // Toggle athlete selection
  const handleAthleteToggle = (athleteId: string) => {
    if (selectedAthleteIds.includes(athleteId)) {
      onAthleteSelect(selectedAthleteIds.filter(id => id !== athleteId));
    } else {
      onAthleteSelect([...selectedAthleteIds, athleteId]);
    }
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const athleteIndex = parseInt(entry.dataKey.split('_')[1]);
            const raw = data[`athlete_${athleteIndex}_raw`];
            const bw = data[`athlete_${athleteIndex}_bodyWeight`];
            const norm = data[`athlete_${athleteIndex}_norm`];
            
            return (
              <div key={index} className="flex items-center gap-2 text-sm mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="font-medium">{entry.name}:</span>
                <span>
                  {bw ? `${raw}kg (${entry.value}x BW)` : `${entry.value} ${data.unit}`}
                </span>
                {norm && (
                  <Badge variant="outline" className="text-xs">
                    {norm}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Perbandingan Hasil Tes Antar Atlet
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TestCategory)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(testCategories) as TestCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {testCategories[cat].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "radar")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tipe Grafik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Athlete Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Pilih Atlet untuk Dibandingkan:</span>
            <Badge variant="secondary">{selectedAthleteIds.length} dipilih</Badge>
          </div>
          <div className="flex flex-wrap gap-4">
            {athletes.map((athlete, index) => (
              <div key={athlete.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`compare-${athlete.id}`}
                  checked={selectedAthleteIds.includes(athlete.id)}
                  onCheckedChange={() => handleAthleteToggle(athlete.id)}
                />
                <Label 
                  htmlFor={`compare-${athlete.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: selectedAthleteIds.includes(athlete.id) 
                        ? ATHLETE_COLORS[selectedAthleteIds.indexOf(athlete.id) % ATHLETE_COLORS.length] 
                        : 'hsl(var(--muted))' 
                    }}
                  />
                  {athlete.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        {selectedAthleteIds.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Pilih minimal satu atlet untuk melihat perbandingan
          </div>
        ) : comparisonData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Tidak ada data tes {testCategories[selectedCategory].name} untuk atlet yang dipilih
          </div>
        ) : chartType === "bar" ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={comparisonData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="testName" 
                  tick={{ fontSize: 11 }} 
                  width={110}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                {selectedAthleteIds.map((athleteId, index) => {
                  const athlete = athletes.find(a => a.id === athleteId);
                  return (
                    <Bar
                      key={athleteId}
                      dataKey={`athlete_${index}`}
                      name={athlete?.name || `Athlete ${index + 1}`}
                      fill={ATHLETE_COLORS[index % ATHLETE_COLORS.length]}
                      radius={[0, 4, 4, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Legend />
                {selectedAthleteIds.map((athleteId, index) => {
                  const athlete = athletes.find(a => a.id === athleteId);
                  return (
                    <Radar
                      key={athleteId}
                      name={athlete?.name || `Athlete ${index + 1}`}
                      dataKey={athlete?.name || `Athlete ${index + 1}`}
                      stroke={ATHLETE_COLORS[index % ATHLETE_COLORS.length]}
                      fill={ATHLETE_COLORS[index % ATHLETE_COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        {selectedAthleteIds.length >= 2 && comparisonData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedAthleteIds.map((athleteId, index) => {
              const athlete = athletes.find(a => a.id === athleteId);
              const testsCount = comparisonData.filter(d => d[`athlete_${index}`] != null).length;
              
              return (
                <div 
                  key={athleteId} 
                  className="p-4 rounded-lg border"
                  style={{ borderColor: ATHLETE_COLORS[index % ATHLETE_COLORS.length] }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: ATHLETE_COLORS[index % ATHLETE_COLORS.length] }}
                    />
                    <span className="font-semibold">{athlete?.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {testsCount} tes {testCategories[selectedCategory].name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
