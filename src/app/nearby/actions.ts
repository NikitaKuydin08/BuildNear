"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { roundCoord } from "@/lib/presence";
import { requireUserId } from "@/lib/session";

// Saves the latest position, rounded to about 1 km. Only the latest one is kept, never a history.
export async function updateLocation(lat: number, lon: number) {
  const userId = await requireUserId();
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return { ok: false as const };
  }
  await getDb()
    .update(users)
    .set({ shareLocation: true, locationLat: roundCoord(lat), locationLon: roundCoord(lon), locationAt: new Date() })
    .where(eq(users.id, userId));
  revalidatePath("/nearby");
  return { ok: true as const };
}

// Turning it off deletes the stored position straight away.
export async function stopSharing() {
  const userId = await requireUserId();
  await getDb()
    .update(users)
    .set({ shareLocation: false, locationLat: null, locationLon: null, locationAt: null })
    .where(eq(users.id, userId));
  revalidatePath("/nearby");
}
