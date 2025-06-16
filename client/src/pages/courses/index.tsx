import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Calendar,
  Search,
  Filter,
  Plus,
  GraduationCap,
  Clock,
} from "lucide-react";

interface Course {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  totalStudents: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  level?: string;
  category?: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const isTeacherOrDirector = user?.role === "teacher" || user?.role === "director";

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && course.isActive) ||
                         (filterStatus === "inactive" && !course.isActive);
    const matchesLevel = filterLevel === "all" || course.level === filterLevel;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  return (
    <Layout title="Courses">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground">
              Manage and view all Islamic studies courses
            </p>
          </div>
          {isTeacherOrDirector && (
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight mb-2">
                        {course.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={course.isActive ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {course.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.totalStudents} students</span>
                      </div>
                      {course.level && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          <span className="capitalize">{course.level}</span>
                        </div>
                      )}
                    </div>

                    {/* Course Duration */}
                    {course.startDate && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Started {new Date(course.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {isTeacherOrDirector && (
                        <Button variant="ghost" size="sm">
                          <Filter className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterStatus !== "all" || filterLevel !== "all"
                  ? "Try adjusting your search or filters"
                  : "No courses have been created yet"}
              </p>
              {isTeacherOrDirector && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Course
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {courses && courses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold">{courses.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
                    <p className="text-2xl font-bold">
                      {courses.filter(c => c.isActive).length}
                    </p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">
                      {courses.reduce((sum, course) => sum + course.totalStudents, 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Students</p>
                    <p className="text-2xl font-bold">
                      {courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + course.totalStudents, 0) / courses.length) : 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}