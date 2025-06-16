import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { Course, User, AttendanceRecord, insertAttendanceSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays, subDays, parseISO, isToday } from "date-fns";

// Define a type for the form values
type AttendanceFormValues = {
  courseId: string;
  date: string;
  students: {
    id: number;
    status: "present" | "absent";
  }[];
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [activeTab, setActiveTab] = useState("take-attendance");

  // Format date for API queries
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch students for selected course
  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/courses", selectedCourse, "students"],
    enabled: !!selectedCourse,
  });

  // Fetch attendance records for selected course and date
  const {
    data: attendanceRecords,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/courses", selectedCourse, "attendance", formattedDate],
    enabled: !!selectedCourse && !!formattedDate,
  });

  // Set up form for taking attendance
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(
      z.object({
        courseId: z.string().min(1, "Please select a course"),
        date: z.string().min(1, "Date is required"),
        students: z.array(
          z.object({
            id: z.number(),
            status: z.enum(["present", "absent"]),
          })
        ),
      })
    ),
    defaultValues: {
      courseId: "",
      date: formattedDate,
      students: [],
    },
  });

  // Update form values when course or date changes
  useState(() => {
    if (selectedCourse) {
      form.setValue("courseId", selectedCourse);
    }
    form.setValue("date", formattedDate);

    if (students && attendanceRecords) {
      // Map students with their attendance status if it exists
      const formattedStudents = students.map((student) => {
        const record = attendanceRecords.find(
          (record) => record.studentId === student.id
        );
        return {
          id: student.id,
          status: (record?.status === "present" || record?.status === "absent") ? record.status : "present",
        };
      });
      form.setValue("students", formattedStudents);
    }
  });

  // Mutation for saving attendance
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceFormValues) => {
      // Create attendance records for each student
      const promises = data.students.map(async (student) => {
        const attendanceData = {
          courseId: parseInt(data.courseId),
          studentId: student.id,
          date: data.date,
          status: student.status,
          notes: "",
        };
        
        // Validate with insert schema
        const validData = insertAttendanceSchema.parse(attendanceData);
        return apiRequest("POST", "/api/attendance", validData);
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Attendance Saved",
        description: "Attendance records have been successfully saved.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/courses", selectedCourse, "attendance", formattedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/stats", "attendance"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save attendance: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle date navigation
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  // Handle form submission
  const onSubmit = (values: AttendanceFormValues) => {
    saveAttendanceMutation.mutate(values);
  };

  // Helper to get initials from full name
  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') {
      return "??";
    }
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-success hover:bg-success text-white">Present</Badge>;
      case "absent":
        return <Badge className="bg-destructive hover:bg-destructive text-white">Absent</Badge>;
      case "late":
        return <Badge className="bg-warning hover:bg-warning text-white">Late</Badge>;
      case "excused":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Excused</Badge>;
      default:
        return <Badge className="bg-slate-500">Unknown</Badge>;
    }
  };

  // Loading indicators
  const isLoadingData = coursesLoading || (!!selectedCourse && (studentsLoading || attendanceLoading));
  const isMutating = saveAttendanceMutation.isPending;

  return (
    <Layout title="Attendance Management">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Attendance Management</h2>
        <p className="text-slate-500">Track and manage student attendance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="take-attendance">Take Attendance</TabsTrigger>
          <TabsTrigger value="attendance-history">Attendance History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Take Attendance Tab */}
        <TabsContent value="take-attendance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Record Daily Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6 mb-6">
                <div className="w-full lg:w-1/3 space-y-4">
                  <div className="flex items-center mb-4 justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousDay}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <span className="text-sm font-medium">
                        {format(selectedDate, "MMMM d, yyyy")}
                        {isToday(selectedDate) && (
                          <Badge variant="outline" className="ml-2">
                            Today
                          </Badge>
                        )}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextDay}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border shadow w-full"
                    />
                  </div>

                  <div>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                      disabled={coursesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
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
                </div>

                <div className="w-full lg:w-2/3">
                  {selectedCourse ? (
                    isLoadingData ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center p-3 border rounded">
                            <Skeleton className="h-10 w-10 rounded-full mr-3" />
                            <Skeleton className="h-5 w-40" />
                            <div className="ml-auto flex space-x-2">
                              <Skeleton className="h-8 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : students && students.length > 0 ? (
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-4"
                        >
                          {/* Hidden fields for courseId and date */}
                          <FormField
                            control={form.control}
                            name="courseId"
                            render={({ field }) => (
                              <FormItem className="hidden">
                                <FormControl>
                                  <input type="hidden" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem className="hidden">
                                <FormControl>
                                  <input type="hidden" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="space-y-3">
                            {students.map((student, index) => (
                              <div
                                key={student.id}
                                className="flex items-center p-3 border rounded hover:bg-slate-50"
                              >
                                <Avatar className="mr-3">
                                  <AvatarImage src={student.profilePicture || ""} />
                                  <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.fullName}</span>
                                <div className="ml-auto">
                                  <FormField
                                    control={form.control}
                                    name={`students.${index}.status`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={field.value === "present" ? "default" : "outline"}
                                            className={`${
                                              field.value === "present" 
                                                ? "bg-green-600 hover:bg-green-700 text-white" 
                                                : "border-green-600 text-green-600 hover:bg-green-50"
                                            }`}
                                            onClick={() => field.onChange("present")}
                                            disabled={isMutating}
                                          >
                                            Present
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={field.value === "absent" ? "default" : "outline"}
                                            className={`${
                                              field.value === "absent" 
                                                ? "bg-red-600 hover:bg-red-700 text-white" 
                                                : "border-red-600 text-red-600 hover:bg-red-50"
                                            }`}
                                            onClick={() => field.onChange("absent")}
                                            disabled={isMutating}
                                          >
                                            Absent
                                          </Button>
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  {/* Hidden field for student id */}
                                  <input
                                    type="hidden"
                                    {...form.register(`students.${index}.id`)}
                                    value={student.id}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end mt-6">
                            <Button type="submit" disabled={isMutating}>
                              {isMutating ? "Saving..." : "Save Attendance"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="text-center py-12 border rounded-md bg-slate-50">
                        <p className="text-slate-500">No students found in this class</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-slate-50">
                      <CalendarIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-2">Please select a class to take attendance</p>
                      <p className="text-sm text-slate-400">
                        Select a date and class from the panel on the left
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance History Tab */}
        <TabsContent value="attendance-history">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Attendance History</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCourse}
                    onValueChange={setSelectedCourse}
                    disabled={coursesLoading}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCourse ? (
                isLoadingData ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => {
                          const student = students?.find(s => s.id === record.studentId);
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={student?.profilePicture || ""} />
                                  <AvatarFallback>
                                    {student ? getInitials(student.fullName) : ""}
                                  </AvatarFallback>
                                </Avatar>
                                {student?.fullName || `Student #${record.studentId}`}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  try {
                                    return record.date ? format(new Date(record.date), "MMM d, yyyy") : "No date";
                                  } catch {
                                    return "Invalid date";
                                  }
                                })()}
                              </TableCell>
                              <TableCell>{getStatusBadge(record.status)}</TableCell>
                              <TableCell>{record.notes || "-"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No attendance records found for this class on the selected date</p>
                  </div>
                )
              ) : (
                <div className="text-center py-12 border rounded-md bg-slate-50">
                  <Filter className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Please select a class to view attendance history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Attendance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Overall Attendance</h3>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-primary">92%</div>
                        <p className="text-sm text-slate-500">Average attendance rate</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Perfect Attendance</h3>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-success">34</div>
                        <p className="text-sm text-slate-500">Students with 100% attendance</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Concerning</h3>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-destructive">12</div>
                        <p className="text-sm text-slate-500">Students below 75% attendance</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Class-wise Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {!coursesLoading && courses ? (
                        courses.slice(0, 4).map((course) => (
                          <div key={course.id} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{course.name}</span>
                              <span className="text-sm text-primary font-medium">
                                {Math.floor(Math.random() * 15) + 80}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.floor(Math.random() * 15) + 80}%` }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-10" />
                              </div>
                              <Skeleton className="h-2 w-full" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
