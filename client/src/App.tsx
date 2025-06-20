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
import LessonDetailPage from "@/pages/lessons/lesson-detail";
import CoursesPage from "@/pages/courses";
import CourseDetailsPage from "@/pages/courses/course-details";
import StudentsPage from "@/pages/students";
import NewStudentPage from "@/pages/students/new-student";
import StudentProfile from "@/pages/students/student-profile";
import StudentClasses from "@/pages/students/student-classes";
import TeachersPage from "@/pages/teachers";
import AboutPage from "@/pages/about";
import SubmissionsPage from "@/pages/assignments/submissions";
import AssignmentsPage from "@/pages/assignments";
import AnalyticsDashboard from "@/pages/analytics/analytics-dashboard";
import QADashboard from "@/pages/qa/qa-dashboard";
import CompanyAdminDashboard from "@/pages/company-admin/company-admin-dashboard";
import ParentNotificationsPage from "@/pages/parent-notifications";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import ParentDashboard from "@/pages/parent-dashboard";
import CommunityPage from "@/pages/community";
import { RoleRedirect } from "@/components/role-redirect";

function Router() {
  const isMobile = useIsMobile();
  
  return (
    <Switch>
      {/* Auth and About pages */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      
      {/* Root route - redirects based on user role */}
      <Route path="/" component={RoleRedirect} />
      
      {/* Role-specific dashboard routes */}
      <ProtectedRoute 
        path="/dashboard/director" 
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
      
      {/* Parent notifications page */}
      <ProtectedRoute 
        path="/parent/notifications" 
        component={ParentNotificationsPage} 
        allowedRoles={["parent", "director", "company_admin"]} 
      />
      
      {/* General notifications page */}
      <ProtectedRoute 
        path="/notifications" 
        component={NotificationsPage} 
      />
      
      {/* Enhanced parent dashboard */}
      <ProtectedRoute 
        path="/parent/dashboard" 
        component={ParentDashboard} 
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
        path="/memorization/:id" 
        component={isMobile ? MemorizationMobile : MemorizationPage} 
      />
      <ProtectedRoute 
        path="/lessons" 
        component={isMobile ? LessonsMobile : LessonsPage} 
      />
      <ProtectedRoute 
        path="/lessons/:id" 
        component={isMobile ? LessonsMobile : LessonDetailPage} 
      />
      <ProtectedRoute 
        path="/courses" 
        component={CoursesPage} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/courses/:courseId" 
        component={CourseDetailsPage} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/students/new" 
        component={NewStudentPage} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/students" 
        component={StudentsPage} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/students/:id/profile" 
        component={StudentProfile} 
        allowedRoles={["director", "teacher"]} 
      />
      <ProtectedRoute 
        path="/students/:studentId/classes" 
        component={StudentClasses} 
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
      
      {/* Company Admin Dashboard */}
      <ProtectedRoute 
        path="/company-admin" 
        component={CompanyAdminDashboard} 
        allowedRoles={["company_admin"]} 
      />
      
      {/* QA Testing Dashboard - Company Admin Only */}
      <ProtectedRoute 
        path="/qa" 
        component={QADashboard} 
        allowedRoles={["company_admin"]} 
      />
      
      {/* Community Features */}
      <ProtectedRoute 
        path="/community" 
        component={CommunityPage} 
      />
      
      {/* Profile page */}
      <ProtectedRoute 
        path="/profile" 
        component={ProfilePage}
      />
      
      {/* Course pages */}
      <ProtectedRoute 
        path="/courses/:courseId" 
        component={CourseDetailsPage}
        allowedRoles={["director", "teacher", "student"]}
      />
      
      {/* Assignment pages */}
      <ProtectedRoute 
        path="/assignments" 
        component={AssignmentsPage}
        allowedRoles={["director", "teacher"]}
      />
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
