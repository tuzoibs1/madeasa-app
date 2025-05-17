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

// Dashboards
import DirectorDashboard from "@/pages/dashboard/director-dashboard";
import TeacherDashboard from "@/pages/dashboard/teacher-dashboard";
import StudentDashboard from "@/pages/dashboard/student-dashboard";

// Pages
import AttendancePage from "@/pages/attendance";
import MemorizationPage from "@/pages/memorization";
import LessonsPage from "@/pages/lessons";
import StudentsPage from "@/pages/students";
import TeachersPage from "@/pages/teachers";

function Router() {
  return (
    <Switch>
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Role-specific dashboards */}
      <ProtectedRoute 
        path="/" 
        component={DirectorDashboard} 
        allowedRoles={["director"]} 
      />
      <ProtectedRoute 
        path="/teacher" 
        component={TeacherDashboard} 
        allowedRoles={["teacher"]} 
      />
      <ProtectedRoute 
        path="/student" 
        component={StudentDashboard} 
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
        component={MemorizationPage} 
      />
      <ProtectedRoute 
        path="/lessons" 
        component={LessonsPage} 
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
