import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { mapSettings } from "./mappers";
import { getUserId } from "./auth-helpers";
import type { Settings, UpdateSettingsInput } from "./types";

export const SETTINGS_KEY = ["settings"] as const;

async function loadOrCreate(): Promise<Settings> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapSettings(data);

  // Trigger may not have run yet; create the row.
  const { data: ins, error: insErr } = await supabase
    .from("settings")
    .insert({ user_id: userId })
    .select()
    .single();
  if (insErr) throw insErr;
  return mapSettings(ins);
}

export function useGetSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: loadOrCreate,
    staleTime: 5 * 60_000,
  });
}

export async function ensureSettings(qc: QueryClient): Promise<Settings> {
  return qc.ensureQueryData({
    queryKey: SETTINGS_KEY,
    queryFn: loadOrCreate,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: UpdateSettingsInput }) => {
      const userId = await getUserId();

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.barbershopName !== undefined) update.barbershop_name = data.barbershopName;
      if (data.dailyGoal !== undefined) update.daily_goal = data.dailyGoal;
      if (data.currency !== undefined) update.currency = data.currency;
      if (data.workStartTime !== undefined) update.work_start_time = data.workStartTime;
      if (data.workEndTime !== undefined) update.work_end_time = data.workEndTime;
      if (data.workDays !== undefined) update.work_days = data.workDays;
      if (data.theme !== undefined) update.theme = data.theme;

      const { data: row, error } = await supabase
        .from("settings")
        .update(update)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return mapSettings(row);
    },
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data);
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
