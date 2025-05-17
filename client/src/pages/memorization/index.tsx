import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Award, BookOpen, Check, PlusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Memorization, Course, User, insertMemorizationSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

// Schema for adding new memorization
const newMemorizationSchema = z.object({
  studentId: z.number(),
  courseId: z.number(),
  surah: z.string().min(1, "Surah name is required"),
  ayahStart: z.number().min(1, "Start ayah must be at least 1"),
  ayahEnd: z.number().min(1, "End ayah must be at least 1"),
  progress: z.number().min(0).max(100).default(0),
  isCompleted: z.boolean().default(false),
});

// Schema for updating memorization progress
const updateProgressSchema = z.object({
  id: z.number(),
  progress: z.number().min(0).max(100),
  isCompleted: z.boolean().default(false),
});

type NewMemorizationValues = z.infer<typeof newMemorizationSchema>;
type UpdateProgressValues = z.infer<typeof updateProgressSchema>;

export default function MemorizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [activeTab, setActiveTab] = useState("track-progress");
  const [addMemorizationOpen, setAddMemorizationOpen] = useState(false);
  
  const isTeacherOrDirector = user?.role === "teacher" || user?.role === "director";
  const isStudent = user?.role === "student";

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch students for selected course
  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/courses", selectedCourse, "students"],
    enabled: !!selectedCourse && isTeacherOrDirector,
  });

  // Fetch memorization data
  const { data: memorizations, isLoading: memorizationsLoading } = useQuery<Memorization[]>({
    queryKey: [
      isTeacherOrDirector && selectedCourse && selectedStudent
        ? ["/api/students", selectedStudent, "memorization"]
        : isTeacherOrDirector && selectedCourse
        ? ["/api/courses", selectedCourse, "memorization"]
        : isStudent
        ? ["/api/students", user?.id, "memorization"]
        : null,
    ],
    enabled: !!(isTeacherOrDirector ? selectedCourse : isStudent),
  });

  // Form for adding new memorization
  const addMemorizationForm = useForm<NewMemorizationValues>({
    resolver: zodResolver(newMemorizationSchema),
    defaultValues: {
      studentId: parseInt(selectedStudent || "0"),
      courseId: parseInt(selectedCourse || "0"),
      surah: "",
      ayahStart: 1,
      ayahEnd: 1,
      progress: 0,
      isCompleted: false,
    },
  });

  // Update form values when course or student changes
  useState(() => {
    if (selectedCourse) {
      addMemorizationForm.setValue("courseId", parseInt(selectedCourse));
    }
    if (selectedStudent) {
      addMemorizationForm.setValue("studentId", parseInt(selectedStudent));
    } else if (isStudent && user) {
      addMemorizationForm.setValue("studentId", user.id);
    }
  });

  // Mutation for adding new memorization
  const addMemorizationMutation = useMutation({
    mutationFn: async (data: NewMemorizationValues) => {
      const validData = insertMemorizationSchema.parse(data);
      const res = await apiRequest("POST", "/api/memorization", validData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New memorization assignment added successfully",
      });
      
      // Close dialog and reset form
      setAddMemorizationOpen(false);
      addMemorizationForm.reset();
      
      // Invalidate relevant queries
      if (isTeacherOrDirector && selectedCourse) {
        if (selectedStudent) {
          queryClient.invalidateQueries({
            queryKey: ["/api/students", selectedStudent, "memorization"],
          });
        }
        queryClient.invalidateQueries({
          queryKey: ["/api/courses", selectedCourse, "memorization"],
        });
      } else if (isStudent) {
        queryClient.invalidateQueries({
          queryKey: ["/api/students", user?.id, "memorization"],
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add memorization: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating memorization progress
  const updateProgressMutation = useMutation({
    mutationFn: async (data: UpdateProgressValues) => {
      const res = await apiRequest("PATCH", `/api/memorization/${data.id}`, {
        progress: data.progress,
        isCompleted: data.progress === 100 ? true : data.isCompleted,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress Updated",
        description: "Memorization progress has been updated successfully",
      });
      
      // Invalidate relevant queries
      if (isTeacherOrDirector && selectedCourse) {
        if (selectedStudent) {
          queryClient.invalidateQueries({
            queryKey: ["/api/students", selectedStudent, "memorization"],
          });
        }
        queryClient.invalidateQueries({
          queryKey: ["/api/courses", selectedCourse, "memorization"],
        });
      } else if (isStudent) {
        queryClient.invalidateQueries({
          queryKey: ["/api/students", user?.id, "memorization"],
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper to get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle form submission for adding memorization
  const onAddMemorizationSubmit = (values: NewMemorizationValues) => {
    addMemorizationMutation.mutate(values);
  };

  // Update progress handler
  const handleProgressUpdate = (memorizationId: number, newProgress: number) => {
    updateProgressMutation.mutate({
      id: memorizationId,
      progress: newProgress,
      isCompleted: newProgress === 100,
    });
  };

  // Loading indicators
  const isLoadingData = coursesLoading || 
    (!!selectedCourse && isTeacherOrDirector && studentsLoading) || 
    memorizationsLoading;

  return (
    <Layout title="Memorization Tracking">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Memorization Tracking</h2>
        <p className="text-slate-500">Monitor and record Quran memorization progress</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="track-progress">Track Progress</TabsTrigger>
          <TabsTrigger value="student-view">Student View</TabsTrigger>
          {isTeacherOrDirector && (
            <TabsTrigger value="class-overview">Class Overview</TabsTrigger>
          )}
        </TabsList>

        {/* Track Progress Tab */}
        <TabsContent value="track-progress">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-lg">Memorization Progress</CardTitle>
                
                <div className="flex flex-wrap gap-2">
                  {isTeacherOrDirector && (
                    <>
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

                      {selectedCourse && (
                        <Select
                          value={selectedStudent}
                          onValueChange={setSelectedStudent}
                          disabled={studentsLoading || !selectedCourse}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Student" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Students</SelectItem>
                            {students?.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                  
                  <Dialog open={addMemorizationOpen} onOpenChange={setAddMemorizationOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-shrink-0" disabled={
                        !selectedCourse || 
                        (isTeacherOrDirector && !selectedStudent) ||
                        addMemorizationMutation.isPending
                      }>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Memorization
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Memorization</DialogTitle>
                        <DialogDescription>
                          Assign a new memorization task to the student.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...addMemorizationForm}>
                        <form
                          onSubmit={addMemorizationForm.handleSubmit(onAddMemorizationSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={addMemorizationForm.control}
                            name="surah"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Surah Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. Al-Fatiha" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addMemorizationForm.control}
                              name="ayahStart"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Ayah</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min={1} 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addMemorizationForm.control}
                              name="ayahEnd"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Ayah</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min={1} 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={addMemorizationForm.control}
                            name="progress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Initial Progress ({field.value}%)</FormLabel>
                                <FormControl>
                                  <Slider
                                    defaultValue={[field.value]}
                                    max={100}
                                    step={5}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addMemorizationForm.control}
                            name="isCompleted"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="form-checkbox h-4 w-4 text-primary rounded"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Mark as completed</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit" disabled={addMemorizationMutation.isPending}>
                              {addMemorizationMutation.isPending ? "Adding..." : "Add Memorization"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : memorizations && memorizations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isTeacherOrDirector && !selectedStudent && <TableHead>Student</TableHead>}
                        <TableHead>Surah</TableHead>
                        <TableHead>Ayat</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        {isTeacherOrDirector && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memorizations.map((memorization) => {
                        const student = students?.find(s => s.id === memorization.studentId);
                        
                        return (
                          <TableRow key={memorization.id}>
                            {isTeacherOrDirector && !selectedStudent && (
                              <TableCell>
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={student?.profilePicture || ""} />
                                    <AvatarFallback>
                                      {student ? getInitials(student.fullName) : ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{student?.fullName || `Student #${memorization.studentId}`}</span>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{memorization.surah}</TableCell>
                            <TableCell>
                              {memorization.ayahStart} - {memorization.ayahEnd}
                              <span className="text-xs text-slate-500 block">
                                ({memorization.ayahEnd - memorization.ayahStart + 1} ayat)
                              </span>
                            </TableCell>
                            <TableCell className="w-[240px]">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={memorization.progress} 
                                  className="w-full"
                                  indicatorClassName={memorization.isCompleted ? "bg-success" : "bg-primary"}
                                />
                                <span className="text-sm font-medium w-10 text-right">
                                  {memorization.progress}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {memorization.isCompleted ? (
                                <Badge className="bg-success hover:bg-success text-white">
                                  <Check className="h-3 w-3 mr-1" /> Completed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                                  In Progress
                                </Badge>
                              )}
                            </TableCell>
                            {isTeacherOrDirector && (
                              <TableCell>
                                <div className="flex items-center gap-4">
                                  <div className="w-32">
                                    <Slider
                                      defaultValue={[memorization.progress]}
                                      max={100}
                                      step={5}
                                      onValueCommit={(vals) => 
                                        handleProgressUpdate(memorization.id, vals[0])
                                      }
                                    />
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-xs h-8"
                                    onClick={() => 
                                      handleProgressUpdate(memorization.id, 100)
                                    }
                                    disabled={memorization.progress === 100}
                                  >
                                    Mark Complete
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-slate-50">
                  <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-2">No memorization records found</p>
                  <p className="text-sm text-slate-400 mb-6">
                    {isTeacherOrDirector
                      ? selectedCourse
                        ? selectedStudent
                          ? "This student has no memorization assignments yet"
                          : "No memorization assignments found for this class"
                        : "Please select a class to view memorization records"
                      : "You don't have any memorization assignments yet"}
                  </p>
                  
                  {selectedCourse && (isStudent || (isTeacherOrDirector && selectedStudent)) && (
                    <Button onClick={() => setAddMemorizationOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Memorization
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student View Tab */}
        <TabsContent value="student-view">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">My Memorization Journey</CardTitle>
                  <CardDescription>Track your progress through the Quran</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-48 w-full" />
                    </div>
                  ) : memorizations && memorizations.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-primary bg-opacity-5 rounded-lg border border-primary border-opacity-20">
                        <div className="text-center sm:text-left mb-4 sm:mb-0">
                          <h3 className="text-xl font-bold text-primary mb-1">
                            {memorizations.filter(m => m.isCompleted).length} Surahs Completed
                          </h3>
                          <p className="text-sm text-slate-600">
                            Total ayat: {memorizations.reduce((acc, m) => acc + (m.ayahEnd - m.ayahStart + 1), 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-10 w-10 text-primary" />
                          <div>
                            <div className="text-sm font-medium">Overall Progress</div>
                            <div className="text-2xl font-bold text-primary">
                              {Math.round(
                                (memorizations.reduce((acc, m) => acc + m.progress, 0) / 
                                (memorizations.length * 100)) * 100
                              )}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Current Memorization</h3>
                        
                        {memorizations.filter(m => !m.isCompleted).length > 0 ? (
                          <div className="space-y-4">
                            {memorizations
                              .filter(m => !m.isCompleted)
                              .sort((a, b) => b.progress - a.progress)
                              .map(memorization => (
                                <Card key={memorization.id} className="overflow-hidden">
                                  <div className="bg-slate-50 px-4 py-3 border-b">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">{memorization.surah}</h4>
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                                        In Progress
                                      </Badge>
                                    </div>
                                  </div>
                                  <CardContent className="p-4">
                                    <div className="mb-4">
                                      <div className="flex justify-between mb-1">
                                        <span className="text-sm">Ayat {memorization.ayahStart}-{memorization.ayahEnd}</span>
                                        <span className="text-sm font-medium">{memorization.progress}%</span>
                                      </div>
                                      <Progress 
                                        value={memorization.progress} 
                                        className="h-2"
                                      />
                                    </div>
                                    
                                    {isStudent && (
                                      <div className="flex justify-end">
                                        <Button 
                                          size="sm" 
                                          onClick={() => 
                                            handleProgressUpdate(
                                              memorization.id, 
                                              Math.min(100, memorization.progress + 10)
                                            )
                                          }
                                          disabled={updateProgressMutation.isPending}
                                        >
                                          Update Progress
                                        </Button>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-lg">
                            <AlertCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500">No current memorization assignments</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-slate-50">
                      <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-2">No memorization progress yet</p>
                      
                      {isStudent && (
                        <Button onClick={() => setAddMemorizationOpen(true)}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Start Memorizing
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Completed Surahs</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : memorizations && memorizations.filter(m => m.isCompleted).length > 0 ? (
                    <div className="space-y-3">
                      {memorizations
                        .filter(m => m.isCompleted)
                        .map(memorization => (
                          <div 
                            key={memorization.id} 
                            className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100"
                          >
                            <div className="bg-success rounded-full p-1 text-white mr-3">
                              <Check className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{memorization.surah}</h4>
                              <p className="text-xs text-slate-500">
                                Ayat {memorization.ayahStart}-{memorization.ayahEnd}
                              </p>
                            </div>
                            {memorization.completionDate && (
                              <div className="ml-auto text-xs text-slate-500">
                                {format(new Date(memorization.completionDate), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500">No completed surahs yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tips for Memorization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-600">
                      <li>Consistency is key - memorize a little each day</li>
                      <li>Recite aloud to strengthen memory</li>
                      <li>Understand the meaning of what you memorize</li>
                      <li>Review previously memorized portions regularly</li>
                      <li>Listen to recitations by proficient reciters</li>
                      <li>Find a quiet place free from distractions</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Class Overview Tab */}
        {isTeacherOrDirector && (
          <TabsContent value="class-overview">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Class Memorization Overview</CardTitle>
                  
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
                </div>
              </CardHeader>
              <CardContent>
                {selectedCourse ? (
                  isLoadingData ? (
                    <div className="space-y-6">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : students && students.length > 0 ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-primary">
                                {memorizations?.filter(m => m.isCompleted).length || 0}
                              </div>
                              <p className="text-sm text-slate-500">Surahs Completed</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-blue-500">
                                {memorizations?.filter(m => !m.isCompleted).length || 0}
                              </div>
                              <p className="text-sm text-slate-500">In Progress</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-secondary">
                                {Math.round(
                                  memorizations && memorizations.length > 0
                                    ? (memorizations.reduce((acc, m) => acc + m.progress, 0) / 
                                      (memorizations.length * 100)) * 100
                                    : 0
                                )}%
                              </div>
                              <p className="text-sm text-slate-500">Average Progress</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Student Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {students.map(student => {
                              const studentMemorizations = memorizations?.filter(
                                m => m.studentId === student.id
                              ) || [];
                              
                              const completedCount = studentMemorizations.filter(
                                m => m.isCompleted
                              ).length;
                              
                              const inProgressCount = studentMemorizations.filter(
                                m => !m.isCompleted
                              ).length;
                              
                              const averageProgress = studentMemorizations.length > 0
                                ? (studentMemorizations.reduce((acc, m) => acc + m.progress, 0) / 
                                  (studentMemorizations.length * 100)) * 100
                                : 0;
                              
                              return (
                                <div key={student.id} className="p-4 border rounded-lg hover:bg-slate-50">
                                  <div className="flex flex-col sm:flex-row sm:items-center mb-3">
                                    <div className="flex items-center mb-2 sm:mb-0">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarImage src={student.profilePicture || ""} />
                                        <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                                      </Avatar>
                                      <h4 className="font-medium">{student.fullName}</h4>
                                    </div>
                                    
                                    <div className="flex gap-3 sm:ml-auto text-sm">
                                      <Badge className="bg-success text-white">
                                        {completedCount} completed
                                      </Badge>
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                                        {inProgressCount} in progress
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-1 flex justify-between">
                                    <span className="text-sm">Overall Progress</span>
                                    <span className="text-sm font-medium">
                                      {Math.round(averageProgress)}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={Math.round(averageProgress)} 
                                    className="h-2"
                                  />
                                  
                                  {studentMemorizations.length === 0 && (
                                    <div className="mt-2 text-center py-2 text-sm text-slate-500">
                                      No memorization assignments yet
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-slate-50">
                      <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-2">No students found in this class</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 border rounded-md bg-slate-50">
                    <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-2">Select a class to view memorization overview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </Layout>
  );
}
