import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Calendar,
  MessageCircle,
  Trophy,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Send,
  Calendar as CalendarIcon,
  Home,
  Target,
  Award,
  Heart,
  Brain,
  CheckSquare,
  BookOpenCheck,
} from "lucide-react";

interface ParentProgress {
  studentId: number;
  studentName: string;
  weeklyAttendance: number;
  memorizationProgress: {
    currentSurah: string;
    versesCompleted: number;
    totalVerses: number;
    weeklyProgress: number;
  };
  behaviorRating: number;
  homeworkCompletion: number;
  upcomingAssignments: Assignment[];
  recentAchievements: Achievement[];
  teacherComments: TeacherComment[];
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  grade?: number;
  teacherFeedback?: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  awardedDate: string;
  category: string;
  points: number;
}

interface TeacherComment {
  id: number;
  teacherName: string;
  comment: string;
  category: string;
  date: string;
  isRead: boolean;
}

interface StudyGroup {
  id: number;
  name: string;
  description: string;
  type: string;
  meetingSchedule: string;
  currentMembers: number;
  maxMembers: number;
}

interface IslamicEvent {
  id: number;
  name: string;
  type: string;
  hijriDate: string;
  gregorianDate: string;
  description: string;
  significance: string;
  educationalContent: string[];
  recommendedActivities: string[];
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    teacherId: "",
    studentId: "",
    subject: "",
    message: ""
  });

  // Fetch parent progress data
  const { data: progressData, isLoading: progressLoading } = useQuery<ParentProgress[]>({
    queryKey: ["/api/parent/progress"],
    enabled: user?.role === 'parent',
  });

  // Fetch study groups
  const { data: studyGroups } = useQuery<StudyGroup[]>({
    queryKey: ["/api/community/study-groups"],
  });

  // Fetch Islamic calendar events
  const { data: islamicEvents } = useQuery<IslamicEvent[]>({
    queryKey: ["/api/community/islamic-calendar"],
  });

  // Fetch today's Islamic events
  const { data: todayEvents } = useQuery<IslamicEvent[]>({
    queryKey: ["/api/community/islamic-calendar/today"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: typeof messageForm) => {
      const res = await apiRequest("POST", "/api/parent/message/send", messageData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the teacher successfully.",
      });
      setMessageDialogOpen(false);
      setMessageForm({ teacherId: "", studentId: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const currentStudent = selectedStudent 
    ? progressData?.find(p => p.studentId === selectedStudent)
    : progressData?.[0];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'memorization': return <BookOpen className="h-4 w-4" />;
      case 'attendance': return <CheckCircle className="h-4 w-4" />;
      case 'behavior': return <Heart className="h-4 w-4" />;
      case 'academic': return <Brain className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'submitted': return 'secondary';
      case 'graded': return 'default';
      default: return 'secondary';
    }
  };

  if (user?.role !== 'parent') {
    return (
      <Layout title="Access Denied">
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-500">This page is only accessible to parents.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Parent Dashboard">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Parent Dashboard</h2>
        <p className="text-slate-600">
          Monitor your children's progress and stay connected with their Islamic education
        </p>
      </div>

      {progressLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-500">Loading dashboard...</p>
        </div>
      ) : !progressData || progressData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Home className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Children Found</h3>
            <p className="text-slate-500">
              No student records are associated with your parent account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Student Selector */}
          {progressData.length > 1 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Select Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {progressData.map((student) => (
                    <Button
                      key={student.studentId}
                      variant={selectedStudent === student.studentId ? "default" : "outline"}
                      onClick={() => setSelectedStudent(student.studentId)}
                    >
                      {student.studentName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStudent && (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Weekly Attendance</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentStudent.weeklyAttendance}%</div>
                      <Progress value={currentStudent.weeklyAttendance} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Homework Completion</CardTitle>
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentStudent.homeworkCompletion}%</div>
                      <Progress value={currentStudent.homeworkCompletion} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Behavior Rating</CardTitle>
                      <Star className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= currentStudent.behaviorRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentStudent.behaviorRating}/5 stars
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Quran Progress</CardTitle>
                      <BookOpenCheck className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentStudent.memorizationProgress.versesCompleted}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        verses memorized
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStudent.recentAchievements.length > 0 ? (
                      <div className="space-y-3">
                        {currentStudent.recentAchievements.map((achievement) => (
                          <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex-shrink-0">
                              {getCategoryIcon(achievement.category)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.title}</h4>
                              <p className="text-sm text-slate-600">{achievement.description}</p>
                              <p className="text-xs text-slate-500">
                                Awarded on {formatDate(achievement.awardedDate)} • {achievement.points} points
                              </p>
                            </div>
                            <Badge variant="secondary">{achievement.category}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">No recent achievements</p>
                    )}
                  </CardContent>
                </Card>

                {/* Teacher Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                      Recent Teacher Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStudent.teacherComments.length > 0 ? (
                      <div className="space-y-3">
                        {currentStudent.teacherComments.map((comment) => (
                          <div key={comment.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{comment.teacherName}</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{comment.category}</Badge>
                                <span className="text-xs text-slate-500">{formatDate(comment.date)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-700">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">No recent comments</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Memorization Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Current Surah</span>
                          <span className="text-sm text-slate-600">
                            {currentStudent.memorizationProgress.currentSurah}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Total Progress</span>
                          <span className="text-sm text-slate-600">
                            {currentStudent.memorizationProgress.versesCompleted} / {currentStudent.memorizationProgress.totalVerses} verses
                          </span>
                        </div>
                        <Progress 
                          value={(currentStudent.memorizationProgress.versesCompleted / currentStudent.memorizationProgress.totalVerses) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {((currentStudent.memorizationProgress.versesCompleted / currentStudent.memorizationProgress.totalVerses) * 100).toFixed(1)}% complete
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">This Week</span>
                          <span className="text-sm text-slate-600">
                            {currentStudent.memorizationProgress.weeklyProgress} new verses
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Upcoming Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStudent.upcomingAssignments.length > 0 ? (
                      <div className="space-y-3">
                        {currentStudent.upcomingAssignments.map((assignment) => (
                          <div key={assignment.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{assignment.title}</h4>
                                <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <div className="flex items-center text-xs text-slate-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due: {formatDate(assignment.dueDate)}
                                  </div>
                                  <Badge variant={getStatusColor(assignment.status)}>
                                    {assignment.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {assignment.grade && (
                              <div className="mt-3 p-2 bg-green-50 rounded">
                                <p className="text-sm font-medium text-green-800">
                                  Grade: {assignment.grade}%
                                </p>
                                {assignment.teacherFeedback && (
                                  <p className="text-xs text-green-700 mt-1">
                                    {assignment.teacherFeedback}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">No upcoming assignments</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Community Tab */}
              <TabsContent value="community" className="space-y-6">
                {/* Today's Islamic Events */}
                {todayEvents && todayEvents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                        Today's Islamic Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {todayEvents.map((event) => (
                          <div key={event.id} className="p-3 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-800">{event.name}</h4>
                            <p className="text-sm text-green-700">{event.description}</p>
                            <p className="text-xs text-green-600 mt-1">{event.hijriDate}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Study Groups */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Available Study Groups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studyGroups && studyGroups.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {studyGroups.map((group) => (
                          <Card key={group.id} className="p-4">
                            <h4 className="font-semibold mb-2">{group.name}</h4>
                            <p className="text-sm text-slate-600 mb-3">{group.description}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{group.meetingSchedule}</span>
                              <span>{group.currentMembers}/{group.maxMembers} members</span>
                            </div>
                            <Badge variant="outline" className="mt-2">
                              {group.type}
                            </Badge>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">No study groups available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Teacher Communication
                      </CardTitle>
                      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Message to Teacher</DialogTitle>
                            <DialogDescription>
                              Send a message to your child's teacher
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="student">Student</Label>
                              <Select 
                                value={messageForm.studentId} 
                                onValueChange={(value) => setMessageForm({...messageForm, studentId: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                                <SelectContent>
                                  {progressData?.map((student) => (
                                    <SelectItem key={student.studentId} value={student.studentId.toString()}>
                                      {student.studentName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="subject">Subject</Label>
                              <Input
                                id="subject"
                                value={messageForm.subject}
                                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                                placeholder="Message subject"
                              />
                            </div>
                            <div>
                              <Label htmlFor="message">Message</Label>
                              <Textarea
                                id="message"
                                value={messageForm.message}
                                onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                                placeholder="Your message to the teacher"
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => sendMessageMutation.mutate(messageForm)}
                              disabled={sendMessageMutation.isPending || !messageForm.studentId || !messageForm.subject || !messageForm.message}
                            >
                              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 text-center py-8">
                      Message history will appear here once implemented
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </Layout>
  );
}