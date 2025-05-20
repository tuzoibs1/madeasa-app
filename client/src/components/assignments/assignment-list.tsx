import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Assignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarIcon, ClipboardList, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AssignmentSubmissionForm } from "./assignment-submission-form";

const assignmentSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  totalPoints: z.number().int().positive("Points must be a positive number")
});

export default function AssignmentList() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  const isTeacherOrDirector = user?.role === 'teacher' || user?.role === 'director';
  const isStudent = user?.role === 'student';

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'assignments'],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/assignments`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json() as Promise<Assignment[]>;
    }
  });

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      courseId: Number(courseId),
      title: '',
      description: '',
      totalPoints: 100
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignmentSchema>) => {
      return apiRequest('POST', '/api/assignments', {
        ...data,
        createdBy: user!.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment created",
        description: "Your assignment has been created successfully."
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'assignments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof assignmentSchema>) => {
    createAssignmentMutation.mutate(data);
  };

  const openSubmissionDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const closeSubmissionDialog = () => {
    setSelectedAssignment(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Assignments</h2>
        {isTeacherOrDirector && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for students in this course.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe this assignment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Points</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            const isPastDue = assignment.dueDate ? new Date(assignment.dueDate) < new Date() : false;
            
            return (
              <Card key={assignment.id} className={isPastDue ? "border-red-300" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    {assignment.title}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    {assignment.dueDate && (
                      <>
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        Due: {format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}
                        {isPastDue && <Badge className="ml-2" variant="destructive">Past Due</Badge>}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {assignment.description || 'No description provided'}
                  </p>
                  <div className="mt-2 text-xs font-medium">
                    Points: {assignment.totalPoints}
                  </div>
                </CardContent>
                <CardFooter>
                  {isStudent && (
                    <Button onClick={() => openSubmissionDialog(assignment)}>
                      Submit Assignment
                    </Button>
                  )}
                  {isTeacherOrDirector && (
                    <Button variant="outline" asChild>
                      <a href={`/assignments/${assignment.id}/submissions`}>
                        View Submissions
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 bg-muted rounded-lg">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No assignments available</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {isTeacherOrDirector
              ? "Create assignments for your students."
              : "No assignments have been created for this course yet."}
          </p>
        </div>
      )}

      {selectedAssignment && (
        <AssignmentSubmissionForm
          assignment={selectedAssignment}
          onClose={closeSubmissionDialog}
        />
      )}
    </div>
  );
}