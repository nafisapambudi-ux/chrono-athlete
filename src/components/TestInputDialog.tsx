import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  testCategories,
  TestCategory,
  TestItem,
  getNormLevel,
  normLevelColors,
  normLevelLabels,
  getAgeGroup,
  calculateAge,
  Gender,
} from "@/lib/testNorms";
import type { Athlete } from "@/hooks/useAthletes";
import type { AthleteTestInput } from "@/hooks/useAthleteTests";

interface TestInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: Athlete | null;
  athleteGender: Gender | null;
  athleteBirthDate: Date | null;
  onSubmit: (inputs: AthleteTestInput[]) => void;
  isSubmitting?: boolean;
}

export function TestInputDialog({
  open,
  onOpenChange,
  athlete,
  athleteGender,
  athleteBirthDate,
  onSubmit,
  isSubmitting = false,
}: TestInputDialogProps) {
  const [testDate, setTestDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<TestCategory>("strength");
  const [selectedTests, setSelectedTests] = useState<Record<string, { value: string; notes: string }>>({});
  const [bodyWeight, setBodyWeight] = useState(athlete?.mass?.toString() || "");

  const currentTests = testCategories[category].tests;
  const age = athleteBirthDate ? calculateAge(athleteBirthDate) : null;
  const ageGroup = age ? getAgeGroup(age) : "dewasa_muda";

  const handleTestValueChange = (testId: string, value: string) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: { ...prev[testId], value, notes: prev[testId]?.notes || "" },
    }));
  };

  const handleTestNotesChange = (testId: string, notes: string) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: { ...prev[testId], notes, value: prev[testId]?.value || "" },
    }));
  };

  const getTestResult = (test: TestItem, value: number): { displayValue: number; normLevel: string | null } => {
    let displayValue = value;
    
    // Untuk tes 1RM relatif terhadap berat badan
    if (test.isRelativeToBodyWeight && bodyWeight) {
      displayValue = value / parseFloat(bodyWeight);
    }

    if (athleteGender && age) {
      const normLevel = getNormLevel(test.id, displayValue, athleteGender, ageGroup, test.higherIsBetter);
      return { displayValue, normLevel };
    }

    return { displayValue, normLevel: null };
  };

  const handleSubmit = () => {
    const inputs: AthleteTestInput[] = [];
    
    Object.entries(selectedTests).forEach(([testId, { value, notes }]) => {
      if (value && value.trim() !== "") {
        const test = currentTests.find(t => t.id === testId);
        if (test && athlete) {
          inputs.push({
            athlete_id: athlete.id,
            test_date: format(testDate, "yyyy-MM-dd"),
            test_category: category,
            test_name: testId,
            result_value: parseFloat(value),
            result_unit: test.unit,
            body_weight_at_test: bodyWeight ? parseFloat(bodyWeight) : undefined,
            notes: notes || undefined,
          });
        }
      }
    });

    if (inputs.length > 0) {
      onSubmit(inputs);
      setSelectedTests({});
      onOpenChange(false);
    }
  };

  const hasValidInputs = Object.values(selectedTests).some(
    ({ value }) => value && value.trim() !== ""
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Input Hasil Tes Bimotor</DialogTitle>
          <DialogDescription>
            {athlete?.name} - {athleteGender === "male" ? "Laki-laki" : athleteGender === "female" ? "Perempuan" : "Gender belum diatur"}
            {age && ` - ${age} tahun`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Test Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Tes</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !testDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {testDate ? format(testDate, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={testDate}
                    onSelect={(date) => date && setTestDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Berat Badan Saat Tes (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="Berat badan"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Kategori Tes</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as TestCategory); setSelectedTests({}); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(testCategories).map(([key, { name }]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Items */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium">Item Tes {testCategories[category].name}</h4>
            
            <div className="space-y-4">
              {currentTests.map((test) => {
                const inputValue = selectedTests[test.id]?.value || "";
                const numValue = parseFloat(inputValue);
                const result = !isNaN(numValue) ? getTestResult(test, numValue) : null;

                return (
                  <div key={test.id} className="grid gap-2 p-3 border rounded-lg bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label className="text-sm font-medium">{test.name}</Label>
                        <p className="text-xs text-muted-foreground">{test.description}</p>
                      </div>
                      {result?.normLevel && (
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full border",
                          normLevelColors[result.normLevel as keyof typeof normLevelColors]
                        )}>
                          {normLevelLabels[result.normLevel as keyof typeof normLevelLabels]}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={`Hasil (${test.unit})`}
                          value={inputValue}
                          onChange={(e) => handleTestValueChange(test.id, e.target.value)}
                        />
                        {test.isRelativeToBodyWeight && inputValue && bodyWeight && (
                          <p className="text-xs text-muted-foreground mt-1">
                            = {(parseFloat(inputValue) / parseFloat(bodyWeight)).toFixed(2)}x BW
                          </p>
                        )}
                      </div>
                      <Input
                        placeholder="Catatan (opsional)"
                        value={selectedTests[test.id]?.notes || ""}
                        onChange={(e) => handleTestNotesChange(test.id, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!hasValidInputs || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Hasil Tes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
