import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { mapService } from "./mappers";
import type { CreateServiceInput, Service, UpdateServiceInput } from "./types";

const KEY = ["services"] as const;

export function useListServices() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapService);
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateServiceInput }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { data: row, error } = await supabase
        .from("services")
        .insert({
          user_id: userId,
          name: data.name,
          price: data.price,
          duration_minutes: data.durationMinutes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapService(row);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceInput }) => {
      const update: Record<string, unknown> = {};
      if (data.name !== undefined) update.name = data.name;
      if (data.price !== undefined) update.price = data.price;
      if (data.durationMinutes !== undefined) update.duration_minutes = data.durationMinutes;
      if (data.isActive !== undefined) update.is_active = data.isActive;
      const { data: row, error } = await supabase
        .from("services")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapService(row);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Soft delete to preserve historical appointments
      const { error } = await supabase
        .from("services")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
