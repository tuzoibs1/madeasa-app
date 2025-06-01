import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Video, Play, Square, Clock, Users, ExternalLink } from "lucide-react";

const createSessionSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  duration: z.number().min(15).max(480),
});

type CreateSessionFormData = z.infer<typeof createSessionSchema>;

interface LiveSessionManagerProps {
  courseId: number;
  userRole: string;
}

export function LiveSessionManager({ courseId, userRole }: LiveSessionManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      courseId,
      title: "",
      description: "",
      scheduledTime: "",
      duration: 60,
    },
  });

  // Fetch sessions for this course
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/sessions`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: CreateSessionFormData) => {
      const res = await apiRequest("POST", "/api/classroom/sessions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Session created successfully",
        description: "Your classroom session has been scheduled.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/sessions`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("POST", `/api/classroom/sessions/${sessionId}/start`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Session started",
        description: "Your classroom session is now live.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/sessions`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("POST", `/api/classroom/sessions/${sessionId}/end`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Session ended",
        description: "The classroom session has been ended.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/sessions`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join session function
  const joinSession = async (sessionId: number) => {
    try {
      const res = await apiRequest("GET", `/api/classroom/sessions/${sessionId}/join`);
      const data = await res.json();
      
      if (data.meetingUrl) {
        window.open(data.meetingUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Failed to join session",
        description: "Could not join the classroom session.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: CreateSessionFormData) => {
    createSessionMutation.mutate(data);
  };

  const canCreateSessions = userRole === 'teacher' || userRole === 'director';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Classroom Sessions</h2>
          <p className="text-slate-600">Schedule and manage live video sessions for your course</p>
        </div>
        
        {canCreateSessions && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Video className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Classroom Session</DialogTitle>
                <DialogDescription>
                  Create a live video session for your students
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter session title"
                            disabled={createSessionMutation.isPending}
                          />
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe what will be covered in this session"
                            disabled={createSessionMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Time</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="datetime-local"
                            disabled={createSessionMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            min={15}
                            max={480}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={createSessionMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createSessionMutation.isPending}
                  >
                    {createSessionMutation.isPending ? "Scheduling..." : "Schedule Session"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading sessions...</div>
      ) : (
        <div className="grid gap-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Video className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">No classroom sessions scheduled yet.</p>
                {canCreateSessions && (
                  <p className="text-sm text-slate-500 mt-2">
                    Click "Schedule Session" to create your first live classroom session.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            sessions.map((session: any) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {session.title}
                        {session.isActive && (
                          <Badge variant="destructive" className="animate-pulse">
                            LIVE
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{session.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {new Date(session.scheduledTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Duration: {session.duration} minutes</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Open to all students</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {session.isActive ? (
                        <>
                          <Button onClick={() => joinSession(session.id)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Session
                          </Button>
                          {canCreateSessions && (
                            <Button 
                              variant="destructive" 
                              onClick={() => endSessionMutation.mutate(session.id)}
                              disabled={endSessionMutation.isPending}
                            >
                              <Square className="h-4 w-4 mr-2" />
                              End Session
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button onClick={() => joinSession(session.id)} variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Room
                          </Button>
                          {canCreateSessions && (
                            <Button 
                              onClick={() => startSessionMutation.mutate(session.id)}
                              disabled={startSessionMutation.isPending}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Session
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}