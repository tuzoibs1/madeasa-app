import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, FileText, PlusCircle, Calendar, Clock, ChevronRight } from "lucide-react";
import { Course, Lesson, insertLessonSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema for creating a new lesson
const newLessonSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  orderIndex: z.number().int().min(1, "Order must be at least 1"),
});

type NewLessonValues = z.infer<typeof newLessonSchema>;

export default function LessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const params = useParams();
  
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  
  const isTeacherOrDirector = user?.role === "teacher" || user?.role === "director";

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch lessons for selected course
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", selectedCourse, "lessons"],
    enabled: !!selectedCourse,
  });



  // Form for adding new lesson
  const addLessonForm = useForm<NewLessonValues>({
    resolver: zodResolver(newLessonSchema),
    defaultValues: {
      courseId: parseInt(selectedCourse || "0"),
      title: "",
      description: "",
      content: "",
      orderIndex: lessons?.length ? lessons.length + 1 : 1,
    },
  });



  // Update courseId when selected course changes
  useEffect(() => {
    if (selectedCourse) {
      addLessonForm.setValue("courseId", parseInt(selectedCourse));
      // Update order index to be after the last lesson
      if (lessons) {
        const maxOrder = lessons.reduce((max, lesson) => 
          lesson.orderIndex > max ? lesson.orderIndex : max, 0
        );
        addLessonForm.setValue("orderIndex", maxOrder + 1);
      }
    }
  }, [selectedCourse, lessons, addLessonForm]);

  // Mutation for adding new lesson
  const addLessonMutation = useMutation({
    mutationFn: async (data: NewLessonValues) => {
      const validData = insertLessonSchema.parse(data);
      const res = await apiRequest("POST", "/api/lessons", validData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New lesson created successfully",
      });
      
      // Close dialog and reset form
      setAddLessonOpen(false);
      addLessonForm.reset();
      
      // Invalidate lessons query to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/courses", selectedCourse, "lessons"],
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
                                  <FormLabel>Lesson Content</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      placeholder="The main content of the lesson" 
                                      rows={6}
                                    />
                                  </FormControl>
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
                        Create First Lesson
                      </Button>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-12 border rounded-md bg-slate-50">
                  <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-2">Please select a class to view lessons</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lesson View Tab */}
        <TabsContent value="lesson-view">
          {selectedLesson ? (
            <Card>
              <div className="bg-primary h-2" />
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Lesson {selectedLesson.orderIndex}</Badge>
                      {selectedCourse && courses && (
                        <Badge variant="secondary">
                          {courses.find(c => c.id.toString() === selectedCourse)?.name}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{selectedLesson.title}</CardTitle>
                    {selectedLesson.description && (
                      <CardDescription className="mt-2">
                        {selectedLesson.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {selectedLesson.content ? 
                          `${Math.ceil(selectedLesson.content.length / 500)} min read` : 
                          "Quick read"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm sm:prose max-w-none pb-6">
                {selectedLesson.content ? (
                  selectedLesson.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No content available for this lesson</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t flex justify-between py-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("lessons-list")}
                >
                  Back to Lessons
                </Button>
                
                {isTeacherOrDirector && (
                  <Button variant="outline" className="text-slate-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Edit Lesson
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="text-center py-12 border rounded-md bg-slate-50">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">No lesson selected</p>
              <Button variant="outline" onClick={() => setActiveTab("lessons-list")}>
                Select a Lesson
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Lesson Resources Tab (Teachers only) */}
        {isTeacherOrDirector && (
          <TabsContent value="lesson-resources">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Teaching Resources</CardTitle>
                    <CardDescription>
                      Resources to help you prepare and deliver lessons effectively
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary rounded-lg p-2 text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Lesson Plan Templates</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              Standardized templates for creating structured and effective lesson plans
                            </p>
                            <Badge variant="outline" className="text-xs">
                              PDF Document
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="bg-secondary rounded-lg p-2 text-white">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Teaching Quran Methodology</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              Comprehensive guide on effective methods for teaching Quran memorization
                            </p>
                            <Badge variant="outline" className="text-xs">
                              Guide
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="bg-accent rounded-lg p-2 text-white">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Islamic Studies Curriculum</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              Full year curriculum breakdown with weekly objectives and milestones
                            </p>
                            <Badge variant="outline" className="text-xs">
                              Curriculum
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recently Shared Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                        <div className="mr-3 text-slate-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">End of Term Assessment Guidelines</h4>
                          <p className="text-xs text-slate-500">Shared by Director • 3 days ago</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          View
                        </Button>
                      </div>
                      
                      <div className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                        <div className="mr-3 text-slate-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Tajweed Rules Summary</h4>
                          <p className="text-xs text-slate-500">Shared by Sheikh Abdullah • 1 week ago</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          View
                        </Button>
                      </div>
                      
                      <div className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                        <div className="mr-3 text-slate-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Student Engagement Activities</h4>
                          <p className="text-xs text-slate-500">Shared by Ustadha Fatima • 2 weeks ago</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Teaching Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="border-b pb-3">
                        <h3 className="font-medium mb-1">Engage All Learning Styles</h3>
                        <p className="text-slate-600">
                          Incorporate visual aids, verbal explanations, and hands-on activities to accommodate different learning preferences.
                        </p>
                      </div>
                      
                      <div className="border-b pb-3">
                        <h3 className="font-medium mb-1">Use Real-World Examples</h3>
                        <p className="text-slate-600">
                          Connect Islamic teachings to contemporary situations to help students understand practical applications.
                        </p>
                      </div>
                      
                      <div className="border-b pb-3">
                        <h3 className="font-medium mb-1">Encourage Questions</h3>
                        <p className="text-slate-600">
                          Create a safe environment where students feel comfortable asking questions and expressing thoughts.
                        </p>
                      </div>
                      
                      <div className="border-b pb-3">
                        <h3 className="font-medium mb-1">Consistent Review</h3>
                        <p className="text-slate-600">
                          Regularly review previous material to reinforce learning and help with retention.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-1">Celebrate Progress</h3>
                        <p className="text-slate-600">
                          Acknowledge and celebrate students' achievements, no matter how small, to maintain motivation.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Upcoming Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start p-3 rounded-lg bg-slate-50">
                        <div className="flex flex-col items-center justify-center bg-primary text-white rounded-lg min-w-14 h-14 mr-3">
                          <span className="text-xs">JUN</span>
                          <span className="text-xl font-bold">25</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Effective Islamic Education</h4>
                          <p className="text-sm text-slate-500">9:00 AM - 12:00 PM</p>
                          <Button variant="link" className="p-0 h-auto text-primary text-xs mt-1">
                            Register Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Layout>
  );
}
