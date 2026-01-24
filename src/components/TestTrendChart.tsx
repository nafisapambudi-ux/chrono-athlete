import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TrendingUp, BarChart3 } from "lucide-react";
import { testCategories, TestCategory, getNormLevel, normLevelColors, normLevelLabels, getAgeGroup, Gender, AgeGroup } from "@/lib/testNorms";
import type { AthleteTest } from "@/hooks/useAthleteTests";

interface TestTrendChartProps {
  tests: AthleteTest[];
  testsByCategory: Record<TestCategory, AthleteTest[]>;
  athleteGender: Gender | null;
  ageGroup: AgeGroup;
  athleteMass: number | null;
}

const CATEGORY_COLORS: Record<TestCategory, string> = {
  strength: "hsl(var(--chart-1))",
  speed: "hsl(var(--chart-2))",
  endurance: "hsl(var(--chart-3))",
  flexibility: "hsl(var(--chart-4))",
  power: "hsl(var(--chart-5))",
  agility: "hsl(220, 70%, 50%)",
};

export function TestTrendChart({
  tests,
  testsByCategory,
  athleteGender,
  ageGroup,
  athleteMass,
}: TestTrendChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>("strength");
  const [selectedTestName, setSelectedTestName] = useState<string>("");

  // Get available test names for selected category
  const availableTests = useMemo(() => {
    const categoryTests = testsByCategory[selectedCategory] || [];
    const uniqueTestNames = [...new Set(categoryTests.map(t => t.test_name))];
    return uniqueTestNames.map(name => {
      const testInfo = testCategories[selectedCategory].tests.find(t => t.id === name);
      return {
        id: name,
        name: testInfo?.name || name,
        unit: testInfo?.unit || "",
        higherIsBetter: testInfo?.higherIsBetter ?? true,
        isRelativeToBodyWeight: testInfo?.isRelativeToBodyWeight || false,
      };
    });
  }, [testsByCategory, selectedCategory]);

  // Auto-select first test when category changes
  useMemo(() => {
    if (availableTests.length > 0 && !availableTests.find(t => t.id === selectedTestName)) {
      setSelectedTestName(availableTests[0].id);
    }
  }, [availableTests, selectedTestName]);

  // Prepare chart data for selected test
  const chartData = useMemo(() => {
    if (!selectedTestName) return [];

    const categoryTests = testsByCategory[selectedCategory] || [];
    const testHistory = categoryTests
      .filter(t => t.test_name === selectedTestName)
      .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());

    const testInfo = testCategories[selectedCategory].tests.find(t => t.id === selectedTestName);

    return testHistory.map(test => {
      let value = test.result_value;
      let displayValue = value;
      
      // For 1RM tests, calculate relative to body weight
      if (testInfo?.isRelativeToBodyWeight && test.body_weight_at_test) {
        displayValue = value / test.body_weight_at_test;
      }

      // Get norm level
      let normLevel = null;
      if (athleteGender) {
        normLevel = getNormLevel(
          test.test_name,
          displayValue,
          athleteGender,
          ageGroup,
          testInfo?.higherIsBetter ?? true
        );
      }

      return {
        date: format(new Date(test.test_date), "d MMM yy", { locale: id }),
        fullDate: format(new Date(test.test_date), "d MMMM yyyy", { locale: id }),
        value: testInfo?.isRelativeToBodyWeight ? Number(displayValue.toFixed(2)) : value,
        rawValue: value,
        bodyWeight: test.body_weight_at_test,
        normLevel,
        unit: testInfo?.unit || test.result_unit,
      };
    });
  }, [testsByCategory, selectedCategory, selectedTestName, athleteGender, ageGroup]);

  // Calculate improvement percentage
  const improvement = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const testInfo = testCategories[selectedCategory].tests.find(t => t.id === selectedTestName);
    const diff = last - first;
    const percentChange = ((diff / first) * 100).toFixed(1);
    const isImproved = testInfo?.higherIsBetter ? diff > 0 : diff < 0;
    return { percentChange, isImproved, diff };
  }, [chartData, selectedCategory, selectedTestName]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.fullDate}</p>
          <p className="text-lg font-bold text-primary">
            {data.rawValue} {data.unit}
            {data.bodyWeight && (
              <span className="text-sm text-muted-foreground ml-1">
                ({data.value}x BW)
              </span>
            )}
          </p>
          {data.normLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${normLevelColors[data.normLevel]}`}>
              {normLevelLabels[data.normLevel]}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  if (tests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Grafik Perkembangan Tes
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TestCategory)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(testCategories) as TestCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {testCategories[cat].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTestName} onValueChange={setSelectedTestName}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih tes" />
              </SelectTrigger>
              <SelectContent>
                {availableTests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {availableTests.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Belum ada data tes untuk kategori {testCategories[selectedCategory].name}
          </div>
        ) : chartData.length < 2 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Minimal 2 data tes diperlukan untuk menampilkan grafik tren
          </div>
        ) : (
          <>
            {/* Improvement Summary */}
            {improvement && (
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className={`h-5 w-5 ${improvement.isImproved ? "text-green-600" : "text-red-600"}`} />
                <span className="text-sm">
                  Perubahan dari tes pertama:
                  <Badge variant={improvement.isImproved ? "default" : "destructive"} className="ml-2">
                    {improvement.diff > 0 ? "+" : ""}{improvement.percentChange}%
                  </Badge>
                </span>
              </div>
            )}

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={availableTests.find(t => t.id === selectedTestName)?.name || selectedTestName}
                    stroke={CATEGORY_COLORS[selectedCategory]}
                    strokeWidth={2}
                    dot={{ fill: CATEGORY_COLORS[selectedCategory], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
