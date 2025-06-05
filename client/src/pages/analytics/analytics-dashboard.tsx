import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import { 
  Users, GraduationCap, Calendar, BookOpen, TrendingUp, TrendingDown,
  Download, Filter, Clock, Award, AlertTriangle
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import Layout from "@/components/layout/layout";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalAttendanceRecords: number;
    averageAttendanceRate: number;
    totalMemorizationProgress: number;
    activeStudentsThisMonth: number;
    completedAssignments: number;
  };
  attendanceTrends: Array<{
    date: string;
    present: number;
    absent: number;
    rate: number;
  }>;
  coursePerformance: Array<{
    courseName: string;
    enrolledStudents: number;
    averageAttendance: number;
    completedAssignments: number;
    averageGrade: number;
  }>;
  memorizationProgress: Array<{
    surah: string;
    studentsCompleted: number;
    averageProgress: number;
  }>;
  studentPerformance: Array<{
    studentName: string;
    attendanceRate: number;
    assignmentsCompleted: number;
    averageGrade: number;
    memorizationProgress: number;
  }>;
  teacherEffectiveness: Array<{
    teacherName: string;
    coursesTeaching: number;
    studentCount: number;
    averageStudentPerformance: number;
    classAttendanceRate: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState("3months");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/dashboard", selectedTimeRange, selectedCourse],
    enabled: !!user && (user.role === 'director' || user.role === 'teacher')
  });

  // Fetch courses for filter
  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Layout title="Analytics Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const overview = analyticsData?.overview;
  const attendanceTrends = analyticsData?.attendanceTrends || [];
  const coursePerformance = analyticsData?.coursePerformance || [];
  const memorizationProgress = analyticsData?.memorizationProgress || [];
  const studentPerformance = analyticsData?.studentPerformance || [];
  const teacherEffectiveness = analyticsData?.teacherEffectiveness || [];

  return (
    <Layout title="Analytics Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-600">Comprehensive insights into Islamic studies performance</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses && courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {overview.activeStudentsThisMonth} active this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.averageAttendanceRate}%</div>
                <Progress value={overview.averageAttendanceRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  {overview.totalTeachers} teachers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.completedAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  Completed this period
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tabs */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="memorization">Memorization</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>
                  Daily attendance patterns over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={attendanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="present" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Present"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="absent" 
                      stackId="1" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Absent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance Overview</CardTitle>
                <CardDescription>
                  Top performing students across all metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentPerformance.slice(0, 10).map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.assignmentsCompleted} assignments completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{student.attendanceRate}%</p>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{student.averageGrade}%</p>
                          <p className="text-xs text-muted-foreground">Avg Grade</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{student.memorizationProgress}%</p>
                          <p className="text-xs text-muted-foreground">Memorization</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memorization" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Memorization Progress</CardTitle>
                  <CardDescription>Surah completion statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={memorizationProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="surah" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="studentsCompleted" fill="#8884d8" name="Students Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memorization Achievements</CardTitle>
                  <CardDescription>Recent completions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {memorizationProgress.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.surah}</p>
                          <p className="text-sm text-muted-foreground">
                            Average progress: {item.averageProgress}%
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {item.studentsCompleted} completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance Analysis</CardTitle>
                <CardDescription>
                  Detailed metrics for each course offering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coursePerformance.map((course, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{course.courseName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.enrolledStudents} students enrolled
                          </p>
                        </div>
                        <Badge variant={course.averageAttendance > 80 ? "default" : "secondary"}>
                          {course.averageAttendance}% attendance
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Assignments</p>
                          <p className="font-medium">{course.completedAssignments}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Average Grade</p>
                          <p className="font-medium">{course.averageGrade}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Attendance</p>
                          <Progress value={course.averageAttendance} className="mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Effectiveness</CardTitle>
                <CardDescription>
                  Performance metrics for teaching staff
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherEffectiveness.map((teacher, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.teacherName}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.coursesTeaching} courses • {teacher.studentCount} students
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{teacher.averageStudentPerformance}%</p>
                          <p className="text-xs text-muted-foreground">Student Performance</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{teacher.classAttendanceRate}%</p>
                          <p className="text-xs text-muted-foreground">Class Attendance</p>
                        </div>
                        <Badge variant={teacher.averageStudentPerformance > 75 ? "default" : "secondary"}>
                          {teacher.averageStudentPerformance > 75 ? "Excellent" : "Good"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}