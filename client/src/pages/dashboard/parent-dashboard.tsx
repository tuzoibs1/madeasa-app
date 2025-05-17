import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { User, Course } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Calendar, BookOpen, Award, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Type for student progress summary from the API
type StudentProgressSummary = {
  studentId: number;
  courses: Course[];
  attendanceRate: number;
  memorizationRate: number;
  averageProgress: number;
  totalCourses: number;
  recentAttendance: {
    id: number;
    courseId: number;
    studentId: number;
    date: string;
    status: string;
    notes?: string;
  }[];
  recentMemorizations: {
    id: number;
    studentId: number;
    courseId: number;
    surah: string;
    ayahStart: number;
    ayahEnd: number;
    completionDate?: string;
    progress: number;
    isCompleted: boolean;
  }[];
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Fetch children (students) of the parent
  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery<User[]>({
    queryKey: ["/api/parents", user?.id, "students"],
    enabled: !!user?.id,
  });

  // Fetch progress summary for the selected student
  const {
    data: studentProgress,
    isLoading: progressLoading,
    error: progressError,
  } = useQuery<StudentProgressSummary>({
    queryKey: ["/api/parent-portal/student", selectedStudentId, "progress"],
    enabled: !!selectedStudentId,
  });

  // Set the first student as selected when the data loads
  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id.toString());
    }
  }, [students, selectedStudentId]);

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get status badge for attendance
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-success hover:bg-success text-white">Present</Badge>;
      case "absent":
        return <Badge className="bg-destructive hover:bg-destructive text-white">Absent</Badge>;
      case "late":
        return <Badge className="bg-warning hover:bg-warning text-white">Late</Badge>;
      case "excused":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Excused</Badge>;
      default:
        return <Badge className="bg-slate-500">Unknown</Badge>;
    }
  };

  // Loading and error states
  if (studentsLoading) {
    return (
      <Layout title="Parent Dashboard">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </Layout>
    );
  }

  if (studentsError) {
    return (
      <Layout title="Parent Dashboard">
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-slate-500">
            There was a problem loading your children's data. Please try again later.
          </p>
        </div>
      </Layout>
    );
  }

  if (students && students.length === 0) {
    return (
      <Layout title="Parent Dashboard">
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Students Linked</h2>
          <p className="text-slate-500 mb-6">
            You don't have any students linked to your account yet.
            Please contact the school administrator to link your children.
          </p>
          <Button>Contact Administration</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Parent Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Parent Dashboard</h1>
        <p className="text-slate-500">
          Monitor your child's academic performance and Islamic studies progress
        </p>
      </div>

      {/* Student Selector */}
      {students && students.length > 0 && (
        <div className="mb-6">
          <Select
            value={selectedStudentId}
            onValueChange={setSelectedStudentId}
          >
            <SelectTrigger className="w-full md:w-1/3">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  {student.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedStudentId && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-800">Attendance</CardTitle>
                <CardDescription>Overall attendance rate</CardDescription>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {studentProgress?.attendanceRate || 0}%
                    </div>
                    <Progress
                      value={studentProgress?.attendanceRate || 0}
                      className="h-2 w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-800">Memorization</CardTitle>
                <CardDescription>Quran memorization progress</CardDescription>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {studentProgress?.memorizationRate || 0}%
                    </div>
                    <Progress
                      value={studentProgress?.memorizationRate || 0}
                      className="h-2 w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-800">Courses</CardTitle>
                <CardDescription>Enrolled courses</CardDescription>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-primary">
                      {studentProgress?.totalCourses || 0}
                    </div>
                    <div className="text-sm text-slate-500 mt-2">
                      Total enrolled courses
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="attendance">
            <TabsList className="mb-4">
              <TabsTrigger value="attendance">Recent Attendance</TabsTrigger>
              <TabsTrigger value="memorization">Memorization Progress</TabsTrigger>
              <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>
                    Recent attendance records for your child
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : studentProgress?.recentAttendance.length ? (
                    <div className="space-y-2">
                      {studentProgress.recentAttendance.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center p-3 border rounded-md"
                        >
                          <div className="mr-4">
                            {record.status === "present" ? (
                              <Check className="h-5 w-5 text-success" />
                            ) : record.status === "absent" ? (
                              <X className="h-5 w-5 text-destructive" />
                            ) : (
                              <Clock className="h-5 w-5 text-warning" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {format(new Date(record.date), "MMMM d, yyyy")}
                            </div>
                            <div className="text-sm text-slate-500">
                              {record.notes || "No notes provided"}
                            </div>
                          </div>
                          <div className="ml-auto">
                            {getStatusBadge(record.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No attendance records found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memorization">
              <Card>
                <CardHeader>
                  <CardTitle>Quran Memorization</CardTitle>
                  <CardDescription>
                    Track your child's Quran memorization progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : studentProgress?.recentMemorizations.length ? (
                    <div className="space-y-4">
                      {studentProgress.recentMemorizations.map((memo) => (
                        <div key={memo.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">
                                Surah {memo.surah}
                              </h4>
                              <p className="text-sm text-slate-500">
                                Ayah {memo.ayahStart} to {memo.ayahEnd}
                              </p>
                            </div>
                            {memo.isCompleted ? (
                              <Badge className="bg-success hover:bg-success text-white">
                                Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                                In Progress
                              </Badge>
                            )}
                          </div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{memo.progress}%</span>
                          </div>
                          <Progress value={memo.progress} className="h-2" />
                          {memo.completionDate && (
                            <div className="text-xs text-slate-500 mt-2">
                              Completed on: {format(new Date(memo.completionDate), "MMMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No memorization records found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Courses</CardTitle>
                  <CardDescription>
                    Courses your child is currently enrolled in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : studentProgress?.courses.length ? (
                    <div className="divide-y">
                      {studentProgress.courses.map((course) => (
                        <div key={course.id} className="py-4">
                          <div className="flex items-center">
                            <div className="bg-primary text-white p-3 rounded-full mr-4">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-lg">{course.name}</h4>
                              <p className="text-sm text-slate-500">
                                {course.description || "No description available"}
                              </p>
                              {course.startDate && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Started: {format(new Date(course.startDate), "MMMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No courses found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Layout>
  );
}