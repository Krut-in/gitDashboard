/**
 * Dashboard Home Page (Protected)
 *
 * Redirects to the repositories page where users can select repos to analyze.
 */

import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/repositories");
}
