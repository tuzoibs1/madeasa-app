import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Calendar,
  BookOpen,
  Target,
  User,
} from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  courseId: number;
  teacherId: number;
  scheduledDate: string;
  duration: number;
  materials: string[];
  objectives: string[];
  status: string;
  orderIndex: number;
  createdAt: string;
}

interface Course {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  totalStudents: number;
  isActive: boolean;
}

export default function LessonDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const lessonId = params.id;

  // Fetch lesson details
  const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
  });

  // Fetch course details
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const course = courses?.find(c => c.id === lesson?.courseId);

  if (lessonLoading) {
    return (
      <Layout title="Loading Lesson">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout title="Lesson Not Found">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The lesson you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/lessons">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Lessons
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date not available';
    }
  };

  return (
    <Layout title={lesson.title}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link href="/lessons" className="self-start">
            <Button variant="outline" size="sm" className="min-w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Back to Lessons</span>
              <span className="xs:hidden">Back</span>
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold break-words">{lesson.title}</h1>
            {course && (
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {course.name}
              </p>
            )}
          </div>
          <Badge 
            variant={lesson.status === 'scheduled' ? 'default' : 'secondary'}
            className="self-start sm:self-center"
          >
            {lesson.status}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Lesson Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {lesson.description}
                </p>
              </CardContent>
            </Card>

            {/* Learning Objectives */}
            {lesson.objectives && lesson.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {lesson.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Lesson Content */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {lesson.content.split('\n').map((paragraph, index) => {
                    if (paragraph.trim() === '') return null;
                    
                    // Handle headings and bullet points
                    if (paragraph.startsWith('•')) {
                      return (
                        <div key={index} className="ml-4 mb-2 flex items-start gap-2">
                          <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span>{paragraph.substring(1).trim()}</span>
                        </div>
                      );
                    } else if (paragraph.startsWith('-')) {
                      return (
                        <div key={index} className="ml-4 mb-2 flex items-start gap-2">
                          <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                          <span>{paragraph.substring(1).trim()}</span>
                        </div>
                      );
                    } else if (paragraph.includes(':') && paragraph.length < 50) {
                      return (
                        <h3 key={index} className="font-semibold text-lg mt-6 mb-3 text-primary">
                          {paragraph}
                        </h3>
                      );
                    } else {
                      return (
                        <p key={index} className="mb-4 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    }
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Lesson Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Scheduled Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(lesson.scheduledDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.duration} minutes
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Order</p>
                    <p className="text-sm text-muted-foreground">
                      Lesson {lesson.orderIndex}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials */}
            {lesson.materials && lesson.materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {lesson.materials.map((material, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{material}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Course Info */}
            {course && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{course.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>{course.totalStudents} students</span>
                      <Badge variant={course.isActive ? 'default' : 'secondary'} className="text-xs">
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}