import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatCard from "@/components/dashboard/stat-card";
import MemorizationProgress from "@/components/dashboard/memorization-progress";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import AttendanceOverview from "@/components/dashboard/attendance-overview";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentEnrollments from "@/components/dashboard/recent-enrollments";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  CalendarCheck 
} from "lucide-react";

export default function DirectorDashboard() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    // Mock data for now
    queryFn: async () => ({
      totalStudents: 245,
      totalTeachers: 18,
      totalCourses: 12,
      attendanceRate: 92,
    }),
  });

  return (
    <Layout title="Director Dashboard">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.fullName}</h2>
        <p className="text-slate-500">Here's what's happening with your institute today.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={isLoading ? "..." : stats?.totalStudents || 0}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          iconBgColor="bg-blue-50"
          change={{
            value: "12% from last month",
            type: "increase",
          }}
        />

        <StatCard
          title="Total Teachers"
          value={isLoading ? "..." : stats?.totalTeachers || 0}
          icon={<UserCheck className="h-5 w-5 text-success" />}
          iconBgColor="bg-green-50"
          change={{
            value: "3 new this month",
            type: "increase",
          }}
        />

        <StatCard
          title="Active Courses"
          value={isLoading ? "..." : stats?.totalCourses || 0}
          icon={<BookOpen className="h-5 w-5 text-accent" />}
          iconBgColor="bg-purple-50"
          change={{
            value: "Same as last month",
            type: "neutral",
          }}
        />

        <StatCard
          title="Attendance Rate"
          value={`${isLoading ? "..." : stats?.attendanceRate || 0}%`}
          icon={<CalendarCheck className="h-5 w-5 text-warning" />}
          iconBgColor="bg-amber-50"
          change={{
            value: "3% from last week",
            type: "decrease",
          }}
        />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MemorizationProgress />
        </div>
        <div>
          <UpcomingEvents />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentEnrollments />
        <AttendanceOverview />
        <QuickActions />
      </div>
    </Layout>
  );
}
