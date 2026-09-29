import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

// Post-login landing: admins go to the admin dashboard, everyone else to their groups.
export default async function Landing() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  redirect(user.isAdmin ? "/admin" : "/groups");
}
