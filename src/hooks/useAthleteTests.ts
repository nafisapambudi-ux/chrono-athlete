import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TestCategory } from "@/lib/testNorms";

export interface AthleteTest {
  id: string;
  athlete_id: string;
  test_date: string;
  test_category: TestCategory;
  test_name: string;
  result_value: number;
  result_unit: string;
  body_weight_at_test: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AthleteTestInput {
  athlete_id: string;
  test_date: string;
  test_category: TestCategory;
  test_name: string;
  result_value: number;
  result_unit: string;
  body_weight_at_test?: number;
  notes?: string;
}

export function useAthleteTests(athleteId?: string) {
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["athlete_tests", athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      
      const { data, error } = await supabase
        .from("athlete_tests")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("test_date", { ascending: false });

      if (error) throw error;
      return data as AthleteTest[];
    },
    enabled: !!athleteId,
  });

  const createTest = useMutation({
    mutationFn: async (input: AthleteTestInput) => {
      const { data, error } = await supabase
        .from("athlete_tests")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete_tests", athleteId] });
      toast.success("Hasil tes berhasil disimpan");
    },
    onError: (error: Error) => {
      toast.error("Gagal menyimpan hasil tes: " + error.message);
    },
  });

  const createMultipleTests = useMutation({
    mutationFn: async (inputs: AthleteTestInput[]) => {
      const { data, error } = await supabase
        .from("athlete_tests")
        .insert(inputs)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete_tests", athleteId] });
      toast.success("Hasil tes berhasil disimpan");
    },
    onError: (error: Error) => {
      toast.error("Gagal menyimpan hasil tes: " + error.message);
    },
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...input }: Partial<AthleteTestInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("athlete_tests")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete_tests", athleteId] });
      toast.success("Hasil tes berhasil diperbarui");
    },
    onError: (error: Error) => {
      toast.error("Gagal memperbarui hasil tes: " + error.message);
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("athlete_tests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete_tests", athleteId] });
      toast.success("Hasil tes berhasil dihapus");
    },
    onError: (error: Error) => {
      toast.error("Gagal menghapus hasil tes: " + error.message);
    },
  });

  // Group tests by category
  const testsByCategory = tests.reduce((acc, test) => {
    if (!acc[test.test_category]) {
      acc[test.test_category] = [];
    }
    acc[test.test_category].push(test);
    return acc;
  }, {} as Record<TestCategory, AthleteTest[]>);

  // Get latest test for each test name
  const latestTests = tests.reduce((acc, test) => {
    const key = `${test.test_category}_${test.test_name}`;
    if (!acc[key] || new Date(test.test_date) > new Date(acc[key].test_date)) {
      acc[key] = test;
    }
    return acc;
  }, {} as Record<string, AthleteTest>);

  return {
    tests,
    testsByCategory,
    latestTests,
    isLoading,
    createTest: createTest.mutate,
    createMultipleTests: createMultipleTests.mutate,
    updateTest: updateTest.mutate,
    deleteTest: deleteTest.mutate,
    isCreating: createTest.isPending || createMultipleTests.isPending,
  };
}
