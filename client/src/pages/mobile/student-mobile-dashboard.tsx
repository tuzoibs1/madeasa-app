import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Redirect } from "wouter";
import MobileAppShell from "@/components/mobile/mobile-app-shell";
import MobileDashboard from "@/components/mobile/mobile-dashboard";

export default function StudentMobileDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Redirect to desktop view if not on mobile
  if (!isMobile) {
    return <Redirect to="/student" />;
  }
  
  // Ensure the user is a student
  if (user?.role !== "student") {
    return <Redirect to="/auth" />;
  }
  
  return (
    <MobileAppShell title="Student Dashboard">
      <MobileDashboard />
    </MobileAppShell>
  );
}