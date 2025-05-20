import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ThemeProvider } from "@/components/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";

// Dashboards
import DirectorDashboard from "@/pages/dashboard/director-dashboard";
import TeacherDashboard from "@/pages/dashboard/teacher-dashboard";
import StudentDashboard from "@/pages/dashboard/student-dashboard";

// Mobile Dashboards
import TeacherMobileDashboard from "@/pages/mobile/teacher-mobile-dashboard";
import StudentMobileDashboard from "@/pages/mobile/student-mobile-dashboard";
import LessonsMobile from "@/pages/mobile/lessons-mobile";
import MemorizationMobile from "@/pages/mobile/memorization-mobile";

// Pages
import AttendancePage from "@/pages/attendance";
import MemorizationPage from "@/pages/memorization";
import LessonsPage from "@/pages/lessons";
import StudentsPage from "@/pages/students";
import TeachersPage from "@/pages/teachers";
import AboutPage from "@/pages/about";

function Router() {
  const isMobile = useIsMobile();
  
  return (
    <Switch>
      {/* Auth and About pages */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={() => import("@/pages/about").then(mod => mod.default())} />
      
      {/* Role-specific dashboards */}
      <ProtectedRoute 
        path="/" 
        component={DirectorDashboard} 
        allowedRoles={["director"]} 
      />
      
      {/* Teacher routes - desktop vs mobile */}
      <ProtectedRoute 
        path="/teacher" 
        component={isMobile ? TeacherMobileDashboard : TeacherDashboard} 
        allowedRoles={["teacher"]} 
      />
      
      {/* Student routes - desktop vs mobile */}
      <ProtectedRoute 
        path="/student" 
        component={isMobile ? StudentMobileDashboard : StudentDashboard} 
        allowedRoles={["student"]} 
      />
      
      {/* Mobile-specific routes */}
      <ProtectedRoute 
        path="/mobile/teacher" 
        component={TeacherMobileDashboard} 
        allowedRoles={["teacher"]} 
      />
      <ProtectedRoute 
        path="/mobile/student" 
        component={StudentMobileDashboard} 
        allowedRoles={["student"]} 
      />
      
      {/* Feature pages */}
      <ProtectedRoute 
        path="/attendance" 
        component={AttendancePage} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/memorization" 
        component={isMobile ? MemorizationMobile : MemorizationPage} 
      />
      <ProtectedRoute 
        path="/lessons" 
        component={isMobile ? LessonsMobile : LessonsPage} 
      />
      <ProtectedRoute 
        path="/students" 
        component={StudentsPage} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/teachers" 
        component={TeachersPage} 
        allowedRoles={["director"]} 
      />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <OnboardingWizard />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
