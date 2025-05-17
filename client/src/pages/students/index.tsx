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
  Search,
  Filter,
  Download,
  Pencil,
  User,
  Mail,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Course, User as UserType, userRoleEnum, insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { hashPassword } from "../../utils/auth";

// Schema for adding new student
const newStudentSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  role: z.literal("student"),
});

type NewStudentValues = z.infer<typeof newStudentSchema>;

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all-students");

  const isDirector = user?.role === "director";

  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users/role/student"],
  });

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Form for adding new student
  const addStudentForm = useForm<NewStudentValues>({
    resolver: zodResolver(newStudentSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "student",
    },
  });

  // Mutation for adding new student
  const addStudentMutation = useMutation({
    mutationFn: async (data: NewStudentValues) => {
      const validData = insertUserSchema.parse(data);
      const res = await apiRequest("POST", "/api/register", validData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New student added successfully",
      });

      // Close dialog and reset form
      setAddStudentOpen(false);
      addStudentForm.reset();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/users/role/student"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding student
  const onAddStudentSubmit = (values: NewStudentValues) => {
    addStudentMutation.mutate(values);
  };

  // Filter students based on search query and selected course
  const filteredStudents = students
    ? students.filter((student) => {
        const matchesSearch = student.fullName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
          student.username.toLowerCase().includes(searchQuery.toLowerCase());

        if (!selectedCourse) return matchesSearch;

        // Add course filtering logic here if we have enrollment data
        return matchesSearch;
      })
    : [];

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
  const isLoading = studentsLoading || coursesLoading;

  return (
    <Layout title="Students Management">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Students Management</h2>
        <p className="text-slate-500">
          Manage students, enrollment, and their progress
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all-students">All Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          {isDirector && (
            <TabsTrigger value="performance">Performance</TabsTrigger>
          )}
        </TabsList>

        {/* All Students Tab */}
        <TabsContent value="all-students">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">Student Directory</CardTitle>

                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search students..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Dialog
                    open={addStudentOpen}
                    onOpenChange={setAddStudentOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                          Fill in the student details to create a new account.
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...addStudentForm}>
                        <form
                          onSubmit={addStudentForm.handleSubmit(
                            onAddStudentSubmit
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={addStudentForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter student's full name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addStudentForm.control}
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
                            control={addStudentForm.control}
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
                            control={addStudentForm.control}
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
                              disabled={addStudentMutation.isPending}
                            >
                              {addStudentMutation.isPending
                                ? "Adding..."
                                : "Add Student"}
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
              ) : filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage
                                  src={student.profilePicture || ""}
                                />
                                <AvatarFallback>
                                  {getInitials(student.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{student.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>
                            {student.email || (
                              <span className="text-slate-400">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">
                                Beginner Quran
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Islamic Studies
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                View Profile
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
                  <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-2">
                    {searchQuery
                      ? "No students found with this search criteria"
                      : "No students found"}
                  </p>
                  <Button onClick={() => setAddStudentOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">Class Enrollment</CardTitle>

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
                      <SelectItem value="">All Classes</SelectItem>
                      {courses?.map((course) => (
                        <SelectItem
                          key={course.id}
                          value={course.id.toString()}
                        >
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCourse ? (
                coursesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary">
                              21
                            </div>
                            <p className="text-sm text-slate-500">
                              Total Students
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-success">
                              92%
                            </div>
                            <p className="text-sm text-slate-500">
                              Attendance Rate
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-blue-500">
                              18
                            </div>
                            <p className="text-sm text-slate-500">
                              Active Students
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-secondary">
                              3
                            </div>
                            <p className="text-sm text-slate-500">
                              Inactive Students
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Student Enrollment List
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead>Attendance</TableHead>
                                <TableHead>Memorization</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {!studentsLoading &&
                                students &&
                                students.slice(0, 5).map((student) => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-2">
                                          <AvatarImage
                                            src={student.profilePicture || ""}
                                          />
                                          <AvatarFallback>
                                            {getInitials(student.fullName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{student.fullName}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>May 12, 2023</TableCell>
                                    <TableCell>
                                      <Badge className="bg-success hover:bg-success text-white">
                                        92%
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-slate-100 rounded-full h-2">
                                          <div
                                            className="bg-primary h-2 rounded-full"
                                            style={{
                                              width: `${70}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <span className="text-xs font-medium">
                                          70%
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-2"
                                        >
                                          View Progress
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-2 text-destructive border-destructive"
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              ) : (
                <div className="text-center py-12 border rounded-md bg-slate-50">
                  <Filter className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-2">
                    Please select a class to view enrollment details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab (Directors only) */}
        {isDirector && (
          <TabsContent value="performance">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Student Performance Overview</CardTitle>
                <CardDescription>
                  Analyze student performance metrics across all classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Top Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {!studentsLoading &&
                            students &&
                            students.slice(0, 3).map((student, index) => (
                              <div
                                key={student.id}
                                className="flex items-center p-2 bg-slate-50 rounded"
                              >
                                <div
                                  className={`${
                                    index === 0
                                      ? "bg-secondary"
                                      : index === 1
                                      ? "bg-accent"
                                      : "bg-blue-500"
                                  } text-white w-6 h-6 rounded-full flex items-center justify-center mr-3`}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={student.profilePicture || ""}
                                    />
                                    <AvatarFallback>
                                      {getInitials(student.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {student.fullName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Advanced Quran Class
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className="ml-auto bg-success hover:bg-success text-white"
                                  variant="secondary"
                                >
                                  95%
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Students Needing Attention
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {!studentsLoading &&
                            students &&
                            students.slice(3, 6).map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center p-2 bg-red-50 rounded"
                              >
                                <AlertTriangle className="text-destructive w-5 h-5 mr-3" />
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={student.profilePicture || ""}
                                    />
                                    <AvatarFallback>
                                      {getInitials(student.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {student.fullName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Beginner Quran Class
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className="ml-auto bg-destructive hover:bg-destructive text-white"
                                  variant="secondary"
                                >
                                  65%
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Recent Achievements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {!studentsLoading &&
                            students &&
                            students.slice(6, 9).map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center p-2 bg-green-50 rounded"
                              >
                                <UserCheck className="text-success w-5 h-5 mr-3" />
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={student.profilePicture || ""}
                                    />
                                    <AvatarFallback>
                                      {getInitials(student.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {student.fullName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Completed Surah Al-Fatiha
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className="ml-auto bg-slate-200 text-slate-700"
                                  variant="secondary"
                                >
                                  2d ago
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Class Performance Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {!coursesLoading &&
                          courses &&
                          courses.map((course) => (
                            <div key={course.id} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">
                                  {course.name}
                                </span>
                                <span className="text-sm font-medium text-primary">
                                  {Math.floor(Math.random() * 15) + 80}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{
                                    width: `${Math.floor(Math.random() * 15) + 80}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>Average Attendance</span>
                                <span>
                                  {Math.floor(Math.random() * 5) + 15}/20 students
                                  above 90%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </Layout>
  );
}
