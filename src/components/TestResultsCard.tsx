import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  testCategories,
  TestCategory,
  getNormLevel,
  normLevelColors,
  normLevelLabels,
  getAgeGroup,
  calculateAge,
  Gender,
} from "@/lib/testNorms";
import type { AthleteTest } from "@/hooks/useAthleteTests";

interface TestResultsCardProps {
  tests: AthleteTest[];
  testsByCategory: Record<TestCategory, AthleteTest[]>;
  latestTests: Record<string, AthleteTest>;
  athleteGender: Gender | null;
  athleteBirthDate: Date | null;
  athleteMass: number | null;
  onDeleteTest?: (id: string) => void;
  isCoach?: boolean;
}

export function TestResultsCard({
  tests,
  testsByCategory,
  latestTests,
  athleteGender,
  athleteBirthDate,
  athleteMass,
  onDeleteTest,
  isCoach = false,
}: TestResultsCardProps) {
  const age = athleteBirthDate ? calculateAge(athleteBirthDate) : null;
  const ageGroup = age ? getAgeGroup(age) : "dewasa_muda";

  const getTestInfo = (testId: string, category: TestCategory) => {
    return testCategories[category].tests.find(t => t.id === testId);
  };

  const getNormBadge = (test: AthleteTest) => {
    const testInfo = getTestInfo(test.test_name, test.test_category as TestCategory);
    if (!testInfo || !athleteGender) return null;

    let value = test.result_value;
    if (testInfo.isRelativeToBodyWeight && test.body_weight_at_test) {
      value = test.result_value / test.body_weight_at_test;
    }

    const level = getNormLevel(test.test_name, value, athleteGender, ageGroup, testInfo.higherIsBetter);
    
    return (
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-full border whitespace-nowrap",
        normLevelColors[level]
      )}>
        {normLevelLabels[level]}
      </span>
    );
  };

  const getTrend = (testName: string, category: TestCategory) => {
    const categoryTests = testsByCategory[category] || [];
    const testHistory = categoryTests
      .filter(t => t.test_name === testName)
      .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
    
    if (testHistory.length < 2) return null;

    const latest = testHistory[testHistory.length - 1].result_value;
    const previous = testHistory[testHistory.length - 2].result_value;
    const testInfo = getTestInfo(testName, category);
    
    const diff = latest - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);

    if (Math.abs(diff) < 0.01) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    const isImprovement = testInfo?.higherIsBetter ? diff > 0 : diff < 0;
    
    return (
      <div className={cn("flex items-center gap-1 text-xs", isImprovement ? "text-green-600" : "text-red-600")}>
        {isImprovement ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{diff > 0 ? "+" : ""}{percentChange}%</span>
      </div>
    );
  };

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Belum ada data hasil tes. Klik "Input Tes Baru" untuk menambahkan hasil tes.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Hasil Tes Bimotor</span>
          <Badge variant="outline">{tests.length} data tes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Accordion type="multiple" className="w-full">
              {(Object.keys(testCategories) as TestCategory[]).map((category) => {
                const categoryData = testsByCategory[category] || [];
                if (categoryData.length === 0) return null;

                const uniqueTests = [...new Set(categoryData.map(t => t.test_name))];

                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{testCategories[category].name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {uniqueTests.length} tes
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {uniqueTests.map((testName) => {
                          const key = `${category}_${testName}`;
                          const latestTest = latestTests[key];
                          if (!latestTest) return null;
                          
                          const testInfo = getTestInfo(testName, category);
                          if (!testInfo) return null;

                          let displayValue = latestTest.result_value;
                          if (testInfo.isRelativeToBodyWeight && latestTest.body_weight_at_test) {
                            displayValue = latestTest.result_value / latestTest.body_weight_at_test;
                          }

                          return (
                            <div key={testName} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{testInfo.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(latestTest.test_date), "d MMM yyyy", { locale: id })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {getTrend(testName, category)}
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {testInfo.isRelativeToBodyWeight 
                                      ? `${latestTest.result_value}kg (${displayValue.toFixed(2)}x BW)`
                                      : `${displayValue} ${testInfo.unit}`
                                    }
                                  </p>
                                </div>
                                {getNormBadge(latestTest)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tes</TableHead>
                    <TableHead>Hasil</TableHead>
                    <TableHead>Norma</TableHead>
                    {isCoach && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.slice(0, 50).map((test) => {
                    const testInfo = getTestInfo(test.test_name, test.test_category as TestCategory);
                    let displayValue = test.result_value;
                    if (testInfo?.isRelativeToBodyWeight && test.body_weight_at_test) {
                      displayValue = test.result_value / test.body_weight_at_test;
                    }

                    return (
                      <TableRow key={test.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(test.test_date), "d MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {testCategories[test.test_category as TestCategory]?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{testInfo?.name || test.test_name}</TableCell>
                        <TableCell>
                          {testInfo?.isRelativeToBodyWeight
                            ? `${test.result_value}kg (${displayValue.toFixed(2)}x)`
                            : `${test.result_value} ${test.result_unit}`
                          }
                        </TableCell>
                        <TableCell>{getNormBadge(test)}</TableCell>
                        {isCoach && onDeleteTest && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteTest(test.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
