import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Calendar, Clock, Users, GraduationCap } from "lucide-react";
import { Link } from "wouter";

interface Student {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  role: string;
}

interface Course {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  createdAt: string;
}

interface Enrollment {
  studentId: number;
  courseId: number;
  enrolledAt: string;
  status: string;
}

export default function StudentClasses() {
  const { studentId } = useParams();

  const { data: student, isLoading: isLoadingStudent } = useQuery<Student>({
    queryKey: [`/api/users/${studentId}`],
  });

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: [`/api/students/${studentId}/enrollments`],
  });

  if (isLoadingStudent || isLoadingCourses || isLoadingEnrollments) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The student you're looking for doesn't exist.
          </p>
          <Link to="/students">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get enrolled courses
  const enrolledCourseIds = enrollments?.map(e => e.courseId) || [];
  const enrolledCourses = courses?.filter(course => enrolledCourseIds.includes(course.id)) || [];

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{student.fullName}'s Classes</h1>
          <p className="text-muted-foreground">
            View all enrolled courses and class information
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="font-medium">{student.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="font-medium">{student.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student ID</p>
              <p className="font-medium">#{student.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Classes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Enrolled Classes</h2>
          <Badge variant="secondary">
            {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Class' : 'Classes'}
          </Badge>
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map((course) => {
              const enrollment = enrollments?.find(e => e.courseId === course.id);
              return (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-primary" />
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                      </div>
                      <Badge 
                        variant={enrollment?.status === 'active' ? 'default' : 'secondary'}
                      >
                        {enrollment?.status || 'Active'}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Enrolled: {enrollment ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        Created: {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link to={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Course
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Enrolled</h3>
                <p className="text-muted-foreground mb-6">
                  This student is not currently enrolled in any classes.
                </p>
                <Link to="/courses">
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Available Courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}