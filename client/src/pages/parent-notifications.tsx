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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  MessageSquare,
  Clock,
  BookOpen,
  Users,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ParentNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");

  // Fetch notification status
  const { data: notificationStatus } = useQuery({
    queryKey: ["/api/notifications/status"],
  });

  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const res = await apiRequest("POST", "/api/notifications/test-sms", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Test Successful",
        description: "Test message sent successfully",
      });
      setTestMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "SMS Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Trigger assignment notification
  const assignmentNotificationMutation = useMutation({
    mutationFn: async (data: { courseId: number; assignmentTitle: string; dueDate: string }) => {
      const res = await apiRequest("POST", "/api/notifications/assignment", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Notifications Sent",
        description: "Parents have been notified about the new assignment",
      });
    },
  });

  // Trigger class reminder notification
  const classReminderMutation = useMutation({
    mutationFn: async (data: { courseId: number; className: string; startTime: string }) => {
      const res = await apiRequest("POST", "/api/notifications/class-reminder", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Class Reminders Sent",
        description: "Parents have been notified about the upcoming class",
      });
    },
  });

  const handleTestSMS = () => {
    if (!testPhoneNumber || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    testSMSMutation.mutate({
      phoneNumber: testPhoneNumber,
      message: testMessage,
    });
  };

  const handleTestAssignmentNotification = () => {
    assignmentNotificationMutation.mutate({
      courseId: 1,
      assignmentTitle: "Surah Al-Fatiha Memorization Test",
      dueDate: "June 15, 2025 at 6:00 PM",
    });
  };

  const handleTestClassReminder = () => {
    classReminderMutation.mutate({
      courseId: 1,
      className: "Quran Memorization Class",
      startTime: "Tomorrow at 9:00 AM",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Parent Notifications</h1>
            <p className="text-muted-foreground">
              Manage and test notification settings for parent communications
            </p>
          </div>
        </div>

        {/* Notification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Notification System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    notificationStatus?.smsEnabled ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>SMS Notifications</span>
                <Badge
                  variant={notificationStatus?.smsEnabled ? "default" : "destructive"}
                >
                  {notificationStatus?.smsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>In-App Notifications</span>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>
            {!notificationStatus?.smsEnabled && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  SMS notifications are disabled. Configure Twilio credentials to enable SMS alerts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test SMS Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Test SMS Notifications</span>
            </CardTitle>
            <CardDescription>
              Send a test SMS to verify the notification system is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="message">Test Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your test message here..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <Button
              onClick={handleTestSMS}
              disabled={testSMSMutation.isPending}
              className="w-full md:w-auto"
            >
              {testSMSMutation.isPending ? "Sending..." : "Send Test SMS"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Types Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Test Notification Types</span>
            </CardTitle>
            <CardDescription>
              Trigger different types of parent notifications to test functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Assignment Alert</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Notify parents when new homework or assignments are posted
                </p>
                <Button
                  onClick={handleTestAssignmentNotification}
                  disabled={assignmentNotificationMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {assignmentNotificationMutation.isPending ? "Sending..." : "Test Assignment Alert"}
                </Button>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Class Reminder</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Send reminders about upcoming classes or events
                </p>
                <Button
                  onClick={handleTestClassReminder}
                  disabled={classReminderMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {classReminderMutation.isPending ? "Sending..." : "Test Class Reminder"}
                </Button>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Progress Update</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Update parents on their child's academic progress
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Notification Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Notification Messages</CardTitle>
            <CardDescription>
              Examples of messages parents will receive for different events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">New Assignment</span>
                </div>
                <p className="text-sm text-blue-800">
                  📝 New assignment for Muhammad Ibn Omar: "Surah Al-Fatiha Memorization". Due: June 15, 2025 at 6:00 PM. Check the app for details.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900">Class Reminder</span>
                </div>
                <p className="text-sm text-green-800">
                  🕐 Reminder: Muhammad Ibn Omar has Quran Memorization Class starting at 9:00 AM tomorrow. Don't forget!
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-purple-900">Progress Update</span>
                </div>
                <p className="text-sm text-purple-800">
                  📚 Muhammad Ibn Omar has completed memorization of Surah Al-Fatiha with excellent tajweed. Great progress this week!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}