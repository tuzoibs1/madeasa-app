import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar, BookOpen, GraduationCap, Phone, Mail, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import Layout from "@/components/layout/layout";

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface StudentProgress {
  student: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    rate: number;
  };
  memorization: Array<{
    id: number;
    surah: string;
    progress: number;
    isCompleted: boolean;
    completionDate: string | null;
  }>;
  assignments: Array<{
    id: number;
    title: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
    grade: number | null;
    courseName: string;
  }>;
  courses: Array<{
    id: number;
    name: string;
    teacherName: string;
    startDate: string;
  }>;
}

export default function ParentPortal() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Fetch students linked to this parent
  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/parents", user?.id, "students"],
    enabled: !!user?.id && user?.role === 'parent'
  });

  // Fetch comprehensive progress for selected student
  const { data: studentProgress, isLoading: progressLoading } = useQuery<StudentProgress>({
    queryKey: ["/api/parent-portal/student", selectedStudentId, "progress"],
    enabled: !!selectedStudentId
  });

  // Auto-select first student if none selected
  React.useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  if (studentsLoading) {
    return (
      <Layout title="Parent Portal">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your children's information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!students || students.length === 0) {
    return (
      <Layout title="Parent Portal">
        <div className="text-center py-12">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Students Found</h2>
          <p className="text-slate-600">
            No students are currently linked to your parent account. 
            Please contact the school administrator to link your children's accounts.
          </p>
        </div>
      </Layout>
    );
  }

  const selectedStudent = studentProgress?.student;

  return (
    <Layout title="Parent Portal">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Parent Portal</h1>
        <p className="text-slate-600">Monitor your children's Islamic studies progress</p>
      </div>

      {/* Student Selection */}
      {students && students.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {students.map((student: any) => (
                <Button
                  key={student.id}
                  variant={selectedStudentId === student.id ? "default" : "outline"}
                  onClick={() => setSelectedStudentId(student.id)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {student.fullName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {progressLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedStudent ? (
        <div className="space-y-6">
          {/* Student Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedStudent.fullName}
              </CardTitle>
              <CardDescription>Student Overview & Contact Information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{selectedStudent.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{selectedStudent.phone || 'No phone provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="memorization">Memorization</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Attendance Rate */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Attendance Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {studentProgress?.attendance?.rate || 0}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {studentProgress?.attendance?.present || 0} of {studentProgress?.attendance?.total || 0} classes
                    </p>
                  </CardContent>
                </Card>

                {/* Memorization Progress */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Memorization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {studentProgress?.memorization?.filter(m => m.isCompleted).length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Surahs completed
                    </p>
                  </CardContent>
                </Card>

                {/* Active Courses */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Active Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {studentProgress?.courses?.length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Currently enrolled
                    </p>
                  </CardContent>
                </Card>

                {/* Pending Assignments */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Pending Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {studentProgress?.assignments?.filter(a => a.status === 'pending').length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Assignments due
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentProgress?.assignments?.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-slate-500">{assignment.courseName}</p>
                        </div>
                        <Badge variant={assignment.status === 'graded' ? 'default' : assignment.status === 'submitted' ? 'secondary' : 'destructive'}>
                          {assignment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>Your child's attendance record across all courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{studentProgress?.attendance?.present || 0}</div>
                      <div className="text-sm text-green-700">Present</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{studentProgress?.attendance?.absent || 0}</div>
                      <div className="text-sm text-red-700">Absent</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{studentProgress?.attendance?.total || 0}</div>
                      <div className="text-sm text-blue-700">Total Classes</div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{studentProgress?.attendance?.rate || 0}%</div>
                      <div className="text-sm text-primary">Attendance Rate</div>
                    </div>
                  </div>
                  <Progress value={studentProgress?.attendance?.rate || 0} className="w-full" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memorization" className="space-y-6">
              <div className="grid gap-4">
                {studentProgress?.memorization?.map((memo) => (
                  <Card key={memo.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{memo.surah}</h3>
                        <Badge variant={memo.isCompleted ? "default" : "secondary"}>
                          {memo.isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{memo.progress}%</span>
                        </div>
                        <Progress value={memo.progress} className="w-full" />
                        {memo.completionDate && (
                          <p className="text-xs text-slate-500">
                            Completed on {format(parseISO(memo.completionDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <div className="grid gap-4">
                {studentProgress?.assignments?.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-slate-500">{assignment.courseName}</p>
                        </div>
                        <Badge variant={
                          assignment.status === 'graded' ? 'default' :
                          assignment.status === 'submitted' ? 'secondary' : 'destructive'
                        }>
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Due: {format(parseISO(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        {assignment.grade !== null && (
                          <span className="font-medium">Grade: {assignment.grade}%</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </Layout>
  );
}