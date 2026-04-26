import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { mapAppointment } from "./mappers";
import { dayEnd, dayStart } from "./dates";
import { getUserId } from "./auth-helpers";
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from "./types";

interface ListParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  serviceId?: string;
}

const APPT_KEY = "appointments";

export function appointmentsKey(params?: ListParams) {
  return [APPT_KEY, params ?? {}] as const;
}

export function useListAppointments(params: ListParams) {
  return useQuery({
    queryKey: appointmentsKey(params),
    queryFn: async (): Promise<Appointment[]> => {
      let q = supabase.from("appointments").select("*").order("started_at", { ascending: true });
      if (params.date) {
        q = q.gte("started_at", dayStart(params.date).toISOString())
             .lte("started_at", dayEnd(params.date).toISOString());
      } else {
        if (params.startDate) q = q.gte("started_at", dayStart(params.startDate).toISOString());
        if (params.endDate) q = q.lte("started_at", dayEnd(params.endDate).toISOString());
      }
      if (params.serviceId) q = q.eq("service_id", params.serviceId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapAppointment);
    },
    staleTime: 30_000,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [APPT_KEY] });
  qc.invalidateQueries({ queryKey: ["summary"] });
  qc.invalidateQueries({ queryKey: ["insights"] });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateAppointmentInput }) => {
      const userId = await getUserId();

      let duration = data.durationSeconds;
      if (duration == null && data.endedAt) {
        duration = Math.max(0, Math.round((new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 1000));
      }

      const { data: row, error } = await supabase
        .from("appointments")
        .insert({
          user_id: userId,
          service_id: data.serviceId,
          service_name: data.serviceName,
          price: data.price,
          started_at: data.startedAt,
          ended_at: data.endedAt,
          duration_seconds: duration,
          note: data.note,
        })
        .select()
        .single();
      if (error) throw error;
      return mapAppointment(row);
    },
    // Optimistic UI: immediately add the new appointment to "today" list + bump summaries
    onMutate: async ({ data }) => {
      await qc.cancelQueries({ queryKey: [APPT_KEY] });
      const date = data.startedAt.slice(0, 10);
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: Appointment = {
        id: optimisticId,
        serviceId: data.serviceId ?? null,
        serviceName: data.serviceName,
        price: data.price,
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
        durationSeconds: data.durationSeconds ?? null,
        note: data.note ?? null,
        createdAt: new Date().toISOString(),
      };
      const key = appointmentsKey({ date });
      const prev = qc.getQueryData<Appointment[]>(key);
      qc.setQueryData<Appointment[]>(key, (old) => [...(old ?? []), optimistic]);
      return { prev, key, optimisticId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => invalidateAll(qc),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentInput }) => {
      const update: Record<string, unknown> = {};
      if (data.serviceId !== undefined) update.service_id = data.serviceId;
      if (data.serviceName !== undefined) update.service_name = data.serviceName;
      if (data.price !== undefined) update.price = data.price;
      if (data.startedAt !== undefined) update.started_at = data.startedAt;
      if (data.endedAt !== undefined) update.ended_at = data.endedAt;
      if (data.durationSeconds !== undefined) update.duration_seconds = data.durationSeconds;
      if (data.note !== undefined) update.note = data.note;

      if (
        update.duration_seconds === undefined &&
        update.started_at !== undefined &&
        update.ended_at != null
      ) {
        update.duration_seconds = Math.max(
          0,
          Math.round((new Date(update.ended_at as string).getTime() - new Date(update.started_at as string).getTime()) / 1000)
        );
      }

      const { data: row, error } = await supabase
        .from("appointments")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapAppointment(row);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}
