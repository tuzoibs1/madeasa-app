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
  const { data: students } = useQuery<any[]>({
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer"
                onClick={() => handleQuickAction(action)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                  {action.urgency === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {action.description}
                </p>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
              </div>
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
          <div className="space-y-4">
            {communicationHistory && communicationHistory.length > 0 ? (
              communicationHistory.map((item: any) => (
                <div key={item.id} className="group relative rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                      {getTypeIcon(item.type || 'message')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">{item.subject}</h4>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(item.status || 'sent')}`}>
                          {item.status || 'sent'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {item.message ? item.message.substring(0, 120) + '...' : item.preview || 'Message content...'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>To {item.teacher || 'Teacher'}</span>
                        </div>
                        <span>{format(new Date(item.sentAt || item.timestamp), 'MMM dd, h:mm a')}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">
                  Start communicating with your child's teachers using the quick actions above.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickAction(quickActions[0])}
                  className="inline-flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send First Message
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center space-x-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {selectedAction?.icon}
              </div>
              <div>
                <span className="font-semibold">{selectedAction?.title}</span>
                {selectedAction?.urgency === 'high' && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedAction?.description} - Send a message to your child's teacher
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Student *</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your child" />
                  </SelectTrigger>
                  <SelectContent>
                    {students && Array.isArray(students) && students.map((student: any) => (
                      <SelectItem key={student.studentId} value={student.studentId.toString()}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{student.studentName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subject *</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Message subject"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message *</label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {messageContent.length}/500 characters
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>Teacher will be notified via SMS</span>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="min-w-[80px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendQuickMessageMutation.isPending || !selectedStudent || !subject.trim() || !messageContent.trim()}
                  className="min-w-[120px]"
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}