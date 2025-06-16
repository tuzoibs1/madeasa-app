import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  Trophy,
  Clock,
  CheckCircle,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { User as UserType, Course, AttendanceRecord } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch student details
  const { data: student, isLoading: studentLoading } = useQuery<UserType>({
    queryKey: ["/api/users", studentId],
    enabled: !!studentId,
  });

  // Fetch student's courses
  const { data: studentCourses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/users", studentId, "courses"],
    enabled: !!studentId,
  });

  // Fetch student's attendance records
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/users", studentId, "attendance"],
    enabled: !!studentId,
  });

  // Fetch student's memorization progress
  const { data: memorizationProgress, isLoading: memorizationLoading } = useQuery<any[]>({
    queryKey: ["/api/users", studentId, "memorization"],
    enabled: !!studentId,
  });

  const isLoading = studentLoading || coursesLoading || attendanceLoading || memorizationLoading;

  // Helper functions
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const calculateAttendanceRate = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return 0;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    return Math.round((presentCount / attendanceRecords.length) * 100);
  };

  const getCompletedSurahs = () => {
    if (!memorizationProgress) return 0;
    return memorizationProgress.filter(progress => progress.isCompleted).length;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { variant: "default" as const, text: "Present" },
      absent: { variant: "destructive" as const, text: "Absent" },
      late: { variant: "secondary" as const, text: "Late" },
      excused: { variant: "outline" as const, text: "Excused" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.absent;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (!studentId) {
    return (
      <Layout title="Student Profile">
        <div className="text-center py-12">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
          <p className="text-slate-600">The requested student profile could not be found.</p>
          <Button onClick={() => setLocation("/students")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${student?.fullName || 'Student'} Profile`}>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => setLocation("/students")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-16 w-16 rounded-full" />
          ) : (
            <Avatar className="h-16 w-16">
              <AvatarImage src={student?.profilePicture || ""} />
              <AvatarFallback className="text-lg">
                {student ? getInitials(student.fullName) : "??"}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div>
            <h1 className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-48" /> : student?.fullName || "Unknown Student"}
            </h1>
            <p className="text-slate-600">
              {isLoading ? <Skeleton className="h-4 w-32" /> : `Student ID: ${student?.id}`}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-2">
                  {calculateAttendanceRate()}%
                </div>
                <Progress value={calculateAttendanceRate()} className="h-2" />
                <p className="text-xs text-slate-500 mt-2">
                  {attendanceRecords?.length || 0} total records
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Memorization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-2">
                  {getCompletedSurahs()}
                </div>
                <p className="text-xs text-slate-500">
                  Surahs completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Active Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-2">
                  {studentCourses?.length || 0}
                </div>
                <p className="text-xs text-slate-500">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="memorization">Memorization</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Username</p>
                        <p className="font-medium">{student?.username || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{student?.email || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium">Not provided</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Address</p>
                        <p className="font-medium">Not provided</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {attendanceRecords?.slice(0, 3).map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium">Attendance</p>
                              <p className="text-xs text-slate-500">
                                {record.date ? format(new Date(record.date), "MMM d, yyyy") : "No date"}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                      ))}
                      
                      {(!attendanceRecords || attendanceRecords.length === 0) && (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Courses</CardTitle>
                  <CardDescription>
                    Courses that {student?.fullName} is currently enrolled in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {studentCourses && studentCourses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {studentCourses.map((course) => (
                        <Card key={course.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{course.name}</h3>
                              <Badge variant="secondary">Active</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">
                              {course.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{course.duration || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                <span>Level {course.level || "1"}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No courses enrolled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>
                    Complete attendance record for {student?.fullName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceRecords && attendanceRecords.length > 0 ? (
                    <div className="space-y-3">
                      {attendanceRecords.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-slate-500" />
                            <div>
                              <p className="font-medium">
                                {record.date ? format(new Date(record.date), "MMMM d, yyyy") : "No date"}
                              </p>
                              <p className="text-sm text-slate-500">
                                {record.notes || "No notes provided"}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No attendance records found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Memorization Tab */}
            <TabsContent value="memorization">
              <Card>
                <CardHeader>
                  <CardTitle>Memorization Progress</CardTitle>
                  <CardDescription>
                    Quran memorization achievements and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {memorizationProgress && memorizationProgress.length > 0 ? (
                    <div className="space-y-3">
                      {memorizationProgress.map((progress, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-slate-500" />
                            <div>
                              <p className="font-medium">{progress.surahName}</p>
                              <p className="text-sm text-slate-500">
                                Verses: {progress.versesMemorized || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {progress.isCompleted ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No memorization progress recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </Layout>
  );
}