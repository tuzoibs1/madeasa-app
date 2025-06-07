import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function RoleRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect based on user role
  switch (user.role) {
    case "company_admin":
      return <Redirect to="/company-admin" />;
    case "director":
      return <Redirect to="/dashboard/director" />;
    case "teacher":
      return <Redirect to="/teacher" />;
    case "student":
      return <Redirect to="/student" />;
    case "parent":
      return <Redirect to="/parent" />;
    default:
      return <Redirect to="/auth" />;
  }
}