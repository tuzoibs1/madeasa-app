import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Redirect } from "wouter";
import MobileAppShell from "@/components/mobile/mobile-app-shell";
import MobileDashboard from "@/components/mobile/mobile-dashboard";

export default function TeacherMobileDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Redirect to desktop view if not on mobile
  if (!isMobile) {
    return <Redirect to="/teacher" />;
  }
  
  // Ensure the user is a teacher
  if (user?.role !== "teacher") {
    return <Redirect to="/auth" />;
  }
  
  return (
    <MobileAppShell title="Teacher Dashboard">
      <MobileDashboard />
    </MobileAppShell>
  );
}