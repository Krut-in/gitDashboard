/**
 * Sign-in Page
 *
 * This page allows users to authenticate with their GitHub account.
 * Clicking the sign-in button redirects users to GitHub's OAuth flow.
 * After successful authentication, users are redirected to the dashboard.
 */

import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Github } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">
            Sign in with your GitHub account to access your dashboard
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full gap-2" size="lg">
            <Github className="w-5 h-5" />
            Sign in with GitHub
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to grant access to your GitHub repositories
            and contribution data.
          </p>
        </div>
      </Card>
    </div>
  );
}
