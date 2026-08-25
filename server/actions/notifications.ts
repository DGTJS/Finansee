"use server";

import { revalidatePath } from "next/cache";
import { authorizationMessage } from "@/server/auth-context";
import { markSpaceNotificationsRead } from "@/server/notifications";

export async function markNotificationsRead(spaceId = "personal-space") {
  try {
    const count = await markSpaceNotificationsRead(spaceId);
    revalidatePath("/");
    return { success: true, count, message: count ? "Notificações marcadas como lidas." : "Não havia notificações novas." };
  } catch (error) {
    return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar as notificações." };
  }
}
