import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  BookOpen,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const newLessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.number().int().min(1, "Course is required"),
  content: z.string().optional(),
  orderIndex: z.number().int().min(1, "Order must be at least 1"),
});

type NewLessonValues = z.infer<typeof newLessonSchema>;

export default function LessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  
  const isTeacherOrDirector = user?.role === "teacher" || user?.role === "director";

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch lessons based on selected course
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", selectedCourse, "lessons"],
    enabled: !!selectedCourse,
  });

  // Form for adding new lesson
  const addLessonForm = useForm<NewLessonValues>({
    resolver: zodResolver(newLessonSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: 0,
      content: "",
      orderIndex: lessons?.length ? lessons.length + 1 : 1,
    },
  });

  // Mutation for adding lesson
  const addLessonMutation = useMutation({
    mutationFn: async (data: NewLessonValues) => {
      const res = await apiRequest("POST", "/api/lessons", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse, "lessons"] });
      setAddLessonOpen(false);
      addLessonForm.reset();
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create lesson: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding lesson
  const onAddLessonSubmit = (values: NewLessonValues) => {
    addLessonMutation.mutate(values);
  };

  // Update courseId when selected course changes
  useEffect(() => {
    if (selectedCourse) {
      addLessonForm.setValue("courseId", parseInt(selectedCourse));
      // Update order index to be after the last lesson
      const nextOrder = lessons?.length ? lessons.length + 1 : 1;
      addLessonForm.setValue("orderIndex", nextOrder);
    }
  }, [selectedCourse, lessons, addLessonForm]);

  // Loading indicators
  const isLoadingData = coursesLoading || (!!selectedCourse && lessonsLoading);

  return (
    <Layout title="Lessons">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Lessons</h2>
        <p className="text-slate-500">Browse and manage lessons for Islamic studies</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Available Lessons</CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                disabled={coursesLoading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isTeacherOrDirector && selectedCourse && (
                <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-shrink-0" disabled={!selectedCourse || addLessonMutation.isPending}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Lesson</DialogTitle>
                      <DialogDescription>
                        Add a new lesson to the selected course.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...addLessonForm}>
                      <form
                        onSubmit={addLessonForm.handleSubmit(onAddLessonSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={addLessonForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lesson Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter lesson title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addLessonForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Brief description of the lesson"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addLessonForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Detailed lesson content"
                                  rows={5}
                                />
                              </FormControl>
                              <FormDescription>
                                Detailed lesson content and materials
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addLessonForm.control}
                          name="orderIndex"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                The order in which this lesson appears
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={addLessonMutation.isPending}>
                            {addLessonMutation.isPending ? "Creating..." : "Create Lesson"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : selectedCourse ? (
            lessons && lessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((lesson) => (
                    <Card key={lesson.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-primary h-2" />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{lesson.title}</CardTitle>
                          <Badge variant="outline" className="ml-2">
                            Lesson {lesson.orderIndex}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {lesson.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-16 overflow-hidden text-sm text-slate-600">
                        <p className="line-clamp-3">
                          {lesson.content ? (
                            lesson.content.substring(0, 120) + (lesson.content.length > 120 ? "..." : "")
                          ) : (
                            "No content available"
                          )}
                        </p>
                      </CardContent>
                      <CardFooter className="border-t pt-3 flex justify-between">
                        <div className="flex items-center text-xs text-slate-500">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>
                            {lesson.content ? 
                              `${Math.ceil(lesson.content.length / 500)} min read` : 
                              "Quick read"}
                          </span>
                        </div>
                        <Link href={`/lessons/${lesson.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-primary"
                          >
                            View Lesson
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-slate-50">
                <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-2">No lessons found for this class</p>
                {isTeacherOrDirector && (
                  <Button onClick={() => setAddLessonOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add First Lesson
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12 border rounded-md bg-slate-50">
              <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Select a class to view lessons</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}