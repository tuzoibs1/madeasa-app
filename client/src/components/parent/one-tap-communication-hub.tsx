import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MessageCircle, 
  Phone, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Send, 
  Bell, 
  BookOpen, 
  User,
  ChevronRight,
  MessageSquare,
  Video,
  Users,
  Target
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'message' | 'meeting' | 'concern' | 'praise' | 'absence' | 'homework';
  template?: string;
  urgency?: 'low' | 'medium' | 'high';
}

interface CommunicationHistory {
  id: number;
  type: 'message' | 'meeting' | 'sms' | 'call';
  subject: string;
  preview: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  teacher: string;
  student: string;
}

interface TeacherAvailability {
  teacherId: number;
  teacherName: string;
  status: 'available' | 'busy' | 'offline';
  nextAvailable?: string;
  preferredContact: 'message' | 'call' | 'meeting';
}

const quickActions: QuickAction[] = [
  {
    id: 'homework_help',
    title: 'Homework Help',
    description: 'Ask about homework or assignments',
    icon: <BookOpen className="h-5 w-5" />,
    type: 'homework',
    template: 'Hello, I would like to ask about my child\'s homework for',
    urgency: 'medium'
  },
  {
    id: 'absence_report',
    title: 'Report Absence',
    description: 'Notify about student absence',
    icon: <Calendar className="h-5 w-5" />,
    type: 'absence',
    template: 'My child will be absent today due to',
    urgency: 'high'
  },
  {
    id: 'progress_inquiry',
    title: 'Progress Check',
    description: 'Ask about academic progress',
    icon: <Target className="h-5 w-5" />,
    type: 'message',
    template: 'I would like to discuss my child\'s progress in',
    urgency: 'low'
  },
  {
    id: 'behavior_concern',
    title: 'Behavior Discussion',
    description: 'Discuss behavioral concerns',
    icon: <AlertTriangle className="h-5 w-5" />,
    type: 'concern',
    template: 'I have some concerns about my child\'s behavior regarding',
    urgency: 'high'
  },
  {
    id: 'praise_teacher',
    title: 'Share Appreciation',
    description: 'Thank teacher or share positive feedback',
    icon: <CheckCircle className="h-5 w-5" />,
    type: 'praise',
    template: 'I wanted to thank you for',
    urgency: 'low'
  },
  {
    id: 'schedule_meeting',
    title: 'Schedule Meeting',
    description: 'Request parent-teacher conference',
    icon: <Video className="h-5 w-5" />,
    type: 'meeting',
    template: 'I would like to schedule a meeting to discuss',
    urgency: 'medium'
  }
];

export default function OneTapCommunicationHub() {
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const [subject, setSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch student data for parent
  const { data: students } = useQuery({
    queryKey: ["/api/parent/progress"],
  });

  // Fetch parent-teacher messages
  const { data: communicationHistory } = useQuery<any[]>({
    queryKey: ["/api/parent/messages"],
  });

  // Send quick message mutation
  const sendQuickMessageMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      subject: string;
      message: string;
      type: string;
    }) => {
      const res = await apiRequest("POST", "/api/parent/message/send", {
        studentId: data.studentId,
        subject: data.subject,
        message: data.message,
        teacherId: ""
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the teacher successfully.",
      });
      setDialogOpen(false);
      setSelectedAction(null);
      setMessageContent("");
      setSubject("");
      setSelectedStudent("");
      queryClient.invalidateQueries({ queryKey: ["/api/parent/messages"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleQuickAction = (action: QuickAction) => {
    setSelectedAction(action);
    setSubject(action.title);
    setMessageContent(action.template || "");
    setDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!selectedStudent || !subject || !messageContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    sendQuickMessageMutation.mutate({
      studentId: selectedStudent,
      subject: subject,
      message: messageContent,
      type: selectedAction?.type || 'message'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'replied': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <Video className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Quick Communication Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-primary/5 hover:border-primary/20"
                onClick={() => handleQuickAction(action)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    {action.icon}
                    <span className="font-medium">{action.title}</span>
                  </div>
                  {action.urgency === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  {action.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {communicationHistory && communicationHistory.length > 0 ? (
              communicationHistory.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium truncate">{item.subject}</h4>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                        sent
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {item.message.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>To Teacher</span>
                      <span>{format(new Date(item.sentAt), 'MMM dd, h:mm a')}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent communications. Use the quick actions above to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedAction?.icon}
              <span>{selectedAction?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Send a quick message to your child's teacher
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.studentId} value={student.studentId.toString()}>
                      {student.studentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Your message to the teacher"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={sendQuickMessageMutation.isPending}
              >
                {sendQuickMessageMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}