import { redirect } from "next/navigation";

export default async function Page() {
  // In production, check auth here
  // For now, redirect from root to dashboard
  redirect("/dashboard");
}