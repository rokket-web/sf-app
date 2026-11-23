import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

// Signed-in users land on their compass; everyone else goes straight to the sign-in box.
export default async function Home() {
  redirect((await getCurrentUser()) ? "/landing" : "/sign-in");
}
