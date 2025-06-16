import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatCard from "@/components/dashboard/stat-card";
import MemorizationProgress from "@/components/dashboard/memorization-progress";
import AttendanceOverview from "@/components/dashboard/attendance-overview";
import QuickActions from "@/components/dashboard/quick-actions";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  BookOpen, 
  CalendarCheck,
  ClipboardCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string;
}

function TeacherTasks() {
  // Fetch teacher tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    // Mock data for now
    queryFn: async () => [
      {
        id: 1,
        title: "Grade weekly quizzes",
        completed: false,
        dueDate: "2023-06-15",
      },
      {
        id: 2,
        title: "Prepare lesson plan for next week",
        completed: false,
        dueDate: "2023-06-16",
      },
      {
        id: 3,
        title: "Update student progress reports",
        completed: true,
        dueDate: "2023-06-10",
      },
      {
        id: 4,
        title: "Meet with parent of Ahmad",
        completed: false,
        dueDate: "2023-06-20",
      },
    ],
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">My Tasks</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-4 w-4 mr-3" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start">
                <Checkbox 
                  id={`task-${task.id}`} 
                  checked={task.completed}
                  className="mt-1"
                />
                <div className="ml-3">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`font-medium text-sm ${task.completed ? "line-through text-slate-400" : ""}`}
                  >
                    {task.title}
                  </label>
                  <p className="text-xs text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No tasks available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Fetch teacher-specific stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/teacher/stats"],
    // Mock data for now
    queryFn: async () => ({
      totalStudents: 45,
      activeCourses: 3,
      attendanceRate: 89,
      upcomingAssessments: 2,
    }),
  });

  return (
    <Layout title="Teacher Dashboard">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.fullName}</h2>
        <p className="text-slate-500">Here's what's happening with your classes today.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Your Students"
          value={isLoading ? "..." : stats?.totalStudents || 0}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          iconBgColor="bg-blue-50"
          change={{
            value: "2 new this week",
            type: "increase",
          }}
          href="/students"
        />

        <StatCard
          title="Your Courses"
          value={isLoading ? "..." : stats?.activeCourses || 0}
          icon={<BookOpen className="h-5 w-5 text-accent" />}
          iconBgColor="bg-purple-50"
          change={{
            value: "Same as last month",
            type: "neutral",
          }}
          href="/courses"
        />

        <StatCard
          title="Attendance Rate"
          value={`${isLoading ? "..." : stats?.attendanceRate || 0}%`}
          icon={<CalendarCheck className="h-5 w-5 text-warning" />}
          iconBgColor="bg-amber-50"
          change={{
            value: "1% from last week",
            type: "decrease",
          }}
          href="/attendance"
        />

        <StatCard
          title="Upcoming Assessments"
          value={isLoading ? "..." : stats?.upcomingAssessments || 0}
          icon={<ClipboardCheck className="h-5 w-5 text-success" />}
          iconBgColor="bg-green-50"
          change={{
            value: "New this week",
            type: "increase",
          }}
        />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MemorizationProgress />
        </div>
        <div>
          <TeacherTasks />
        </div>
      </div>

      {/* Additional Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceOverview />
        <QuickActions />
      </div>
    </Layout>
  );
}
