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
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  UserPlus,
  Presentation,
  Search,
  Mail,
  Phone,
  Book,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  User,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { Course, User as UserType, insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema for adding new teacher
const newTeacherSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  role: z.literal("teacher"),
});

type NewTeacherValues = z.infer<typeof newTeacherSchema>;

export default function TeachersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<UserType | null>(null);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all-teachers");

  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users/role/teacher"],
  });

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Form for adding new teacher
  const addTeacherForm = useForm<NewTeacherValues>({
    resolver: zodResolver(newTeacherSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "teacher",
    },
  });

  // Mutation for adding new teacher
  const addTeacherMutation = useMutation({
    mutationFn: async (data: NewTeacherValues) => {
      const validData = insertUserSchema.parse(data);
      const res = await apiRequest("POST", "/api/register", validData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New teacher added successfully",
      });

      // Close dialog and reset form
      setAddTeacherOpen(false);
      addTeacherForm.reset();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/users/role/teacher"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add teacher: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding teacher
  const onAddTeacherSubmit = (values: NewTeacherValues) => {
    addTeacherMutation.mutate(values);
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers
    ? teachers.filter((teacher) =>
        teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // View teacher details
  const viewTeacherDetails = (teacher: UserType) => {
    setSelectedTeacher(teacher);
    setActiveTab("teacher-profile");
  };

  // Helper to get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Loading indicator
  const isLoading = teachersLoading || coursesLoading;

  return (
    <Layout title="Teachers Management">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Teachers Management</h2>
        <p className="text-slate-500">
          Manage teachers and their assigned courses
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all-teachers">All Teachers</TabsTrigger>
          <TabsTrigger value="teacher-profile" disabled={!selectedTeacher}>
            Teacher Profile
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* All Teachers Tab */}
        <TabsContent value="all-teachers">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">Teacher Directory</CardTitle>

                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search teachers..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Dialog
                    open={addTeacherOpen}
                    onOpenChange={setAddTeacherOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Teacher
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Teacher</DialogTitle>
                        <DialogDescription>
                          Fill in the teacher details to create a new account.
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...addTeacherForm}>
                        <form
                          onSubmit={addTeacherForm.handleSubmit(
                            onAddTeacherSubmit
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={addTeacherForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter teacher's full name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addTeacherForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter username"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addTeacherForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Enter password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addTeacherForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="Enter email address"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button
                              type="submit"
                              disabled={addTeacherMutation.isPending}
                            >
                              {addTeacherMutation.isPending
                                ? "Adding..."
                                : "Add Teacher"}
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
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredTeachers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned Courses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage
                                  src={teacher.profilePicture || ""}
                                />
                                <AvatarFallback>
                                  {getInitials(teacher.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{teacher.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{teacher.username}</TableCell>
                          <TableCell>
                            {teacher.email || (
                              <span className="text-slate-400">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20 text-xs"
                              >
                                Beginner Quran
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
                              >
                                Islamic Studies
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-success text-white">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => viewTeacherDetails(teacher)}
                              >
                                View Profile
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-slate-50">
                  <Presentation className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-2">
                    {searchQuery
                      ? "No teachers found with this search criteria"
                      : "No teachers found"}
                  </p>
                  <Button onClick={() => setAddTeacherOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Teacher
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Profile Tab */}
        <TabsContent value="teacher-profile">
          {selectedTeacher ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={selectedTeacher.profilePicture || ""} />
                        <AvatarFallback className="text-lg">
                          {getInitials(selectedTeacher.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold mb-1">
                        {selectedTeacher.fullName}
                      </h2>
                      <Badge className="mb-4">Islamic Studies Teacher</Badge>

                      <div className="w-full space-y-3 mt-4">
                        <div className="flex items-center px-4 py-2 bg-slate-50 rounded-md">
                          <Mail className="h-4 w-4 text-slate-500 mr-3" />
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm">
                              {selectedTeacher.email || "Not set"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center px-4 py-2 bg-slate-50 rounded-md">
                          <User className="h-4 w-4 text-slate-500 mr-3" />
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Username</p>
                            <p className="text-sm">{selectedTeacher.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center px-4 py-2 bg-slate-50 rounded-md">
                          <Phone className="h-4 w-4 text-slate-500 mr-3" />
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-sm">Not set</p>
                          </div>
                        </div>

                        <div className="flex items-center px-4 py-2 bg-slate-50 rounded-md">
                          <Calendar className="h-4 w-4 text-slate-500 mr-3" />
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Joined</p>
                            <p className="text-sm">
                              {selectedTeacher.createdAt
                                ? new Date(
                                    selectedTeacher.createdAt
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Assigned Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {coursesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {courses?.slice(0, 3).map((course) => (
                          <div
                            key={course.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                          >
                            <div className="flex items-start mb-3 sm:mb-0">
                              <div className="bg-primary rounded-lg p-2 text-white mr-3">
                                <Book className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-medium">{course.name}</h3>
                                <p className="text-sm text-slate-500">
                                  {course.description || "No description provided"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Students</p>
                                <p className="font-medium">21</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Attendance</p>
                                <p className="font-medium text-success">93%</p>
                              </div>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                          </div>
                        ))}

                        <div className="text-center">
                          <Button variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Assign New Course
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <h4 className="text-2xl font-bold text-success">94%</h4>
                        <p className="text-sm text-slate-600">Attendance Rate</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <h4 className="text-2xl font-bold text-blue-500">89%</h4>
                        <p className="text-sm text-slate-600">Student Retention</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4 text-center">
                        <h4 className="text-2xl font-bold text-amber-500">76%</h4>
                        <p className="text-sm text-slate-600">Student Progress</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-base">Recent Feedback</h3>

                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-success mr-2" />
                            <h4 className="font-medium">Positive Feedback</h4>
                          </div>
                          <Badge variant="outline">From Director</Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          Excellent work with the beginner Quran class. Students have shown remarkable progress in their memorization.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Received on May 12, 2023</p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-amber-500 mr-2" />
                            <h4 className="font-medium">Improvement Area</h4>
                          </div>
                          <Badge variant="outline">From Director</Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          Need to improve attendance tracking. Some students' attendance was not properly recorded last week.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Received on April 28, 2023</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Students Under Supervision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teachersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded-full mr-3" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-1/3" />
                              <Skeleton className="h-3 w-1/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[...Array(6)].map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center p-2 border rounded"
                          >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {String.fromCharCode(65 + index)}
                                {String.fromCharCode(75 + index)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">Student {index + 1}</p>
                              <p className="text-xs text-slate-500">
                                {index % 2 === 0
                                  ? "Beginner Quran Class"
                                  : "Islamic Studies Class"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-primary"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-center border-t pt-4">
                    <Button variant="outline" size="sm">
                      View All Students
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-md bg-slate-50">
              <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">No teacher selected</p>
              <Button
                variant="outline"
                onClick={() => setActiveTab("all-teachers")}
              >
                Select a Teacher
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Teacher Performance Overview</CardTitle>
              <CardDescription>
                Analyze teacher performance metrics across all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">
                          {!teachersLoading ? filteredTeachers.length : "-"}
                        </div>
                        <p className="text-sm text-slate-500">
                          Active Teachers
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-success">
                          94%
                        </div>
                        <p className="text-sm text-slate-500">
                          Avg. Attendance Rate
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-secondary">
                          87%
                        </div>
                        <p className="text-sm text-slate-500">
                          Student Satisfaction
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-500">
                          12
                        </div>
                        <p className="text-sm text-slate-500">
                          Active Courses
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Teacher Performance Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {!teachersLoading &&
                        filteredTeachers.slice(0, 5).map((teacher, index) => (
                          <div key={teacher.id} className="space-y-2">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={teacher.profilePicture || ""} />
                                <AvatarFallback>
                                  {getInitials(teacher.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="font-medium text-sm">
                                {teacher.fullName}
                              </h3>
                              <Badge
                                className="ml-auto"
                                variant="outline"
                              >
                                {index === 0
                                  ? "Advanced"
                                  : index === 1
                                  ? "Proficient"
                                  : "Developing"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Student Progress</span>
                                  <span className="font-medium">
                                    {95 - index * 5}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{
                                      width: `${95 - index * 5}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Attendance Rate</span>
                                  <span className="font-medium">
                                    {98 - index * 3}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div
                                    className="bg-success h-1.5 rounded-full"
                                    style={{
                                      width: `${98 - index * 3}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Student Retention</span>
                                  <span className="font-medium">
                                    {90 - index * 4}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div
                                    className="bg-secondary h-1.5 rounded-full"
                                    style={{
                                      width: `${90 - index * 4}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Student-Teacher Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {!coursesLoading &&
                          courses?.slice(0, 4).map((course) => (
                            <div key={course.id} className="flex justify-between items-center p-3 border rounded">
                              <div>
                                <h4 className="font-medium text-sm">{course.name}</h4>
                                <p className="text-xs text-slate-500">
                                  Teacher: {
                                    filteredTeachers?.find(t => t.id === course.teacherId)?.fullName || "Unassigned"
                                  }
                                </p>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 text-slate-400 mr-1" />
                                <span className="text-sm font-medium">
                                  1:{Math.floor(Math.random() * 5) + 15}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Training Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 border rounded bg-green-50">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-success mr-2" />
                            <span className="font-medium text-sm">Tajweed Rules Training</span>
                          </div>
                          <Badge className="bg-success text-white">
                            100% Completed
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center p-3 border rounded bg-green-50">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-success mr-2" />
                            <span className="font-medium text-sm">Child Protection</span>
                          </div>
                          <Badge className="bg-success text-white">
                            100% Completed
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center p-3 border rounded bg-amber-50">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                            <span className="font-medium text-sm">Digital Learning Tools</span>
                          </div>
                          <Badge className="bg-amber-500 text-white">
                            75% Completed
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center p-3 border rounded bg-red-50">
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-destructive mr-2" />
                            <span className="font-medium text-sm">Special Educational Needs</span>
                          </div>
                          <Badge className="bg-destructive text-white">
                            Not Started
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
