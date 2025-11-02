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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-sky-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      <NavBar user={user} />
      <main className="flex-grow pt-16 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
