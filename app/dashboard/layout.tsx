/**
 * Dashboard Layout Component
 *
 * Wraps all dashboard pages with a consistent navigation bar and footer.
 * Displays the application name and sign-out functionality.
 * Ensures user is authenticated before accessing any dashboard pages.
 */

import { requireAuth } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and get user session
  let session;
  try {
    session = await requireAuth();
  } catch (error) {
    // Redirect to home page if not authenticated
    redirect("/");
  }

  // Convert session to GitHubUser format for NavBar
  const user = {
    name: session.user.name,
    username: session.user.username,
    email: session.user.email,
    image: session.user.image,
    avatarUrl: session.user.avatarUrl,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={user} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
