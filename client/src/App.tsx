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
import ParentPortal from "@/pages/parent-portal";

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
import CourseDetailsPage from "@/pages/courses/course-details";
import SubmissionsPage from "@/pages/assignments/submissions";
import AnalyticsDashboard from "@/pages/analytics/analytics-dashboard";
import QADashboard from "@/pages/qa/qa-dashboard";

function Router() {
  const isMobile = useIsMobile();
  
  return (
    <Switch>
      {/* Auth and About pages */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      
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
      
      {/* Parent portal */}
      <ProtectedRoute 
        path="/parent" 
        component={ParentPortal} 
        allowedRoles={["parent"]} 
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
      
      {/* Analytics Dashboard */}
      <ProtectedRoute 
        path="/analytics" 
        component={AnalyticsDashboard} 
        allowedRoles={["director", "teacher"]} 
      />
      
      {/* Course pages */}
      <ProtectedRoute 
        path="/courses/:courseId" 
        component={CourseDetailsPage}
        allowedRoles={["director", "teacher", "student"]}
      />
      
      {/* Assignment pages */}
      <ProtectedRoute 
        path="/assignments/:assignmentId/submissions" 
        component={SubmissionsPage}
        allowedRoles={["director", "teacher"]}
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
