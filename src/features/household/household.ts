/**
 * Household data from Supabase, through TanStack Query.
 *
 * useQuery = read and cache; useMutation = change something on the server.
 * After a change, the cached value is updated so every screen that shows
 * the household re-renders without another request.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { normalizeInviteCode } from "../../lib/inviteCode";
import { requireSupabase } from "../../storage/supabaseClient";

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
}

export interface Member {
  userId: string;
  email: string | null;
  name: string | null;
  joinedAt: string;
}

/** Cache keys: one place, so reads and updates always match. */
export const householdKeys = {
  mine: (userId: string) => ["household", userId] as const,
  members: (householdId: string) =>
    ["household", householdId, "members"] as const,
};

function toHousehold(row: {
  id: string;
  name: string;
  invite_code: string;
}): Household {
  return { id: row.id, name: row.name, inviteCode: row.invite_code };
}

/** The signed-in user's household; `null` when they don't have one yet. */
export function useHousehold() {
  const { user, status } = useAuth();
  return useQuery({
    queryKey: householdKeys.mine(user?.id ?? ""),
    enabled: status === "signedIn" && user !== null,
    queryFn: async (): Promise<Household | null> => {
      const { data, error } = await requireSupabase()
        .from("household_members")
        .select("household:households (id, name, invite_code)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.household ? toHousehold(data.household) : null;
    },
  });
}

export function useHouseholdMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: householdKeys.members(householdId ?? ""),
    enabled: householdId !== undefined,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await requireSupabase()
        .from("household_members")
        .select("user_id, email, display_name, joined_at")
        .order("joined_at");
      if (error) throw error;
      return data.map((m) => ({
        userId: m.user_id,
        email: m.email,
        name: m.display_name,
        joinedAt: m.joined_at,
      }));
    },
  });
}

/** Shared by "create" and "join": both end with the user in a household. */
function useEnterHousehold<T>(call: (input: T) => Promise<Household>) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: call,
    onSuccess: (household) => {
      if (user)
        queryClient.setQueryData(householdKeys.mine(user.id), household);
    },
  });
}

export function useCreateHousehold() {
  return useEnterHousehold(async (name: string) => {
    const { data, error } = await requireSupabase().rpc("create_household", {
      household_name: name.trim(),
    });
    if (error) throw error;
    return toHousehold(data);
  });
}

export function useJoinHousehold() {
  return useEnterHousehold(async (code: string) => {
    const { data, error } = await requireSupabase().rpc("join_household", {
      code: normalizeInviteCode(code),
    });
    if (error) throw error;
    return toHousehold(data);
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await requireSupabase().rpc(
        "regenerate_invite_code",
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (inviteCode) => {
      if (!user) return;
      queryClient.setQueryData<Household | null>(
        householdKeys.mine(user.id),
        (old) => (old ? { ...old, inviteCode } : old),
      );
    },
  });
}

const KNOWN_ERRORS = [
  "invalid_code",
  "already_member",
  "not_signed_in",
  "not_member",
] as const;

/**
 * The database functions fail with short codes ("invalid_code"); this turns
 * any error into a translation key the UI can show.
 */
export function householdErrorKey(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  return (KNOWN_ERRORS as readonly string[]).includes(message)
    ? `household.errors.${message}`
    : "household.errors.generic";
}
