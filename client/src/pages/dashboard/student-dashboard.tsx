import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  CheckSquare, 
  CalendarCheck,
  Award,
  BookMarked,
  Clock,
  Calendar
} from "lucide-react";
import { Memorization, Course, Lesson, AttendanceRecord } from "@shared/schema";
import { format, parseISO, isToday, isPast, isThisWeek } from "date-fns";

// Student progress component
function MemorizationSummary() {
  const { user } = useAuth();
  
  // Fetch student memorization data
  const { data: memorizations, isLoading } = useQuery<Memorization[]>({
    queryKey: ["/api/students", user?.id, "memorization"],
    enabled: !!user?.id,
  });

  const totalMemorized = memorizations?.filter(m => m.isCompleted).length || 0;
  const inProgress = memorizations?.filter(m => !m.isCompleted).length || 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">My Memorization Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : memorizations && memorizations.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <h4 className="text-xl font-bold text-success">{totalMemorized}</h4>
                <p className="text-xs text-slate-600">Completed</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <h4 className="text-xl font-bold text-blue-500">{inProgress}</h4>
                <p className="text-xs text-slate-600">In Progress</p>
              </div>
            </div>
            
            <h4 className="font-medium text-sm mb-3">Recent Progress</h4>
            <div className="space-y-3">
              {memorizations.slice(0, 3).map(memorization => (
                <div key={memorization.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h5 className="font-medium text-sm">{memorization.surah}</h5>
                    <p className="text-xs text-slate-500">
                      Ayah {memorization.ayahStart}-{memorization.ayahEnd}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Progress 
                      value={memorization.progress} 
                      className="w-16 h-2 mr-2" 
                      indicatorClassName={memorization.isCompleted ? "bg-success" : "bg-primary"} 
                    />
                    <p className="text-xs font-medium">
                      {memorization.progress}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <a href="/memorization" className="text-primary text-sm font-medium hover:underline">
                View All Memorization
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <BookMarked className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No memorization records yet</p>
            <p className="text-sm mt-1">Start tracking your memorization progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Upcoming lessons component
function UpcomingLessons() {
  const { user } = useAuth();
  
  // Fetch courses the student is enrolled in
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/students", user?.id, "courses"],
    enabled: !!user?.id,
    // Mocked query function
    queryFn: async () => [
      { id: 1, name: "Beginner Quran", description: "Introduction to Quran reading", teacherId: 1 } as Course,
      { id: 2, name: "Islamic Studies", description: "Basic principles of Islam", teacherId: 2 } as Course
    ]
  });
  
  // Fetch upcoming lessons
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/students", user?.id, "lessons"],
    enabled: !!user?.id && !!courses?.length,
    // Mocked query function
    queryFn: async () => [
      { 
        id: 1, 
        courseId: 1, 
        title: "Surah Al-Fatiha", 
        description: "Learning the opening chapter",
        orderIndex: 1
      } as Lesson,
      { 
        id: 2, 
        courseId: 1, 
        title: "Surah Al-Nas", 
        description: "Understanding the meaning",
        orderIndex: 2
      } as Lesson,
      { 
        id: 3, 
        courseId: 2, 
        title: "Pillars of Islam", 
        description: "The five pillars of Islam",
        orderIndex: 1
      } as Lesson
    ]
  });
  
  const isLoading = coursesLoading || lessonsLoading;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Upcoming Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : lessons && lessons.length > 0 ? (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const course = courses?.find(c => c.id === lesson.courseId);
              return (
                <div key={lesson.id} className="border-b border-slate-100 pb-3">
                  <h4 className="font-medium">{lesson.title}</h4>
                  <p className="text-sm text-slate-500">{lesson.description}</p>
                  <div className="flex justify-between mt-1">
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-100 text-blue-600">
                      {course?.name}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Lesson {lesson.orderIndex}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No upcoming lessons</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Attendance component
function AttendanceHistory() {
  const { user } = useAuth();
  
  // Fetch attendance records
  const { data: attendance, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/students", user?.id, "attendance"],
    enabled: !!user?.id
  });
  
  // Calculate attendance statistics
  const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
  const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
  const lateCount = attendance?.filter(a => a.status === 'late').length || 0;
  const excusedCount = attendance?.filter(a => a.status === 'excused').length || 0;
  
  const totalRecords = attendance?.length || 0;
  const attendanceRate = totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0;
  
  const recentAttendance = attendance
    ?.filter(a => isPast(new Date(a.date)) && isThisWeek(new Date(a.date)))
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">My Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : attendance && attendance.length > 0 ? (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Attendance Rate</p>
                <p className="text-sm font-medium text-primary">{attendanceRate}%</p>
              </div>
              <Progress value={attendanceRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-green-50 rounded p-2">
                <p className="text-lg font-bold text-success">{presentCount}</p>
                <p className="text-xs text-slate-600">Present</p>
              </div>
              <div className="bg-red-50 rounded p-2">
                <p className="text-lg font-bold text-destructive">{absentCount}</p>
                <p className="text-xs text-slate-600">Absent</p>
              </div>
              <div className="bg-amber-50 rounded p-2">
                <p className="text-lg font-bold text-warning">{lateCount}</p>
                <p className="text-xs text-slate-600">Late</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-lg font-bold text-blue-500">{excusedCount}</p>
                <p className="text-xs text-slate-600">Excused</p>
              </div>
            </div>
            
            {recentAttendance && recentAttendance.length > 0 && (
              <>
                <h4 className="font-medium text-sm mb-2">Recent Attendance</h4>
                <div className="space-y-2">
                  {recentAttendance.map((record) => {
                    const date = new Date(record.date);
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <div key={record.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          <span className="text-sm">
                            {isToday ? 'Today' : format(date, 'MMM d, yyyy')}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            record.status === 'present' ? 'bg-green-50 text-success border-green-200' :
                            record.status === 'absent' ? 'bg-red-50 text-destructive border-red-200' :
                            record.status === 'late' ? 'bg-amber-50 text-warning border-amber-200' :
                            'bg-blue-50 text-blue-500 border-blue-200'
                          }
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No attendance records yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Achievements component
function Achievements() {
  const achievements = [
    { id: 1, title: "First Surah", description: "Completed memorization of your first surah", earned: true },
    { id: 2, title: "Perfect Week", description: "Attended all classes for a week", earned: true },
    { id: 3, title: "Quick Learner", description: "Completed a lesson in record time", earned: false },
    { id: 4, title: "Consistent Student", description: "Attended 30 days in a row", earned: false },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">My Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`flex items-start p-3 rounded-lg ${
                achievement.earned ? 'bg-amber-50' : 'bg-slate-50 opacity-60'
              }`}
            >
              <div className={`rounded-full p-2 ${
                achievement.earned ? 'bg-secondary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <Award className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-sm">{achievement.title}</h4>
                <p className="text-xs text-slate-600">{achievement.description}</p>
              </div>
              {achievement.earned && (
                <Badge variant="outline" className="ml-auto bg-secondary/10 text-secondary border-secondary/20">
                  Earned
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Current teachers component
function MyTeachers() {
  const { data: teachers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/students/teachers"],
    // Mocked query function
    queryFn: async () => [
      { 
        id: 1, 
        fullName: "Sheikh Abdullah", 
        profilePicture: "", 
        course: "Beginner Quran"
      },
      { 
        id: 2, 
        fullName: "Ustadha Fatima", 
        profilePicture: "", 
        course: "Islamic Studies"
      },
    ]
  });
  
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">My Teachers</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : teachers && teachers.length > 0 ? (
          <div className="space-y-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center">
                <Avatar>
                  <AvatarImage src={teacher.profilePicture} />
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(teacher.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h4 className="font-medium text-sm">{teacher.fullName}</h4>
                  <p className="text-xs text-slate-500">{teacher.course}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <p>No teachers assigned yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <Layout title="Student Dashboard">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Welcome, {user?.fullName}</h2>
        <p className="text-slate-500">Track your progress and stay up to date with your studies.</p>
      </div>

      {/* First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <UpcomingLessons />
        </div>
        <div>
          <MemorizationSummary />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceHistory />
        </div>
        <div className="space-y-6">
          <Achievements />
          <MyTeachers />
        </div>
      </div>
    </Layout>
  );
}
