import { supabase } from "../supabase";

let cachedUserId: string | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id ?? null;
});

export async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error("Not signed in");
  cachedUserId = id;
  return id;
}

export function getCachedUserId(): string | null {
  return cachedUserId;
}
