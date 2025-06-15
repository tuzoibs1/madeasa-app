import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  MessageSquare,
  Clock,
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'assignment' | 'attendance' | 'grade' | 'announcement' | 'reminder';
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Mock notifications data - replace with real API call
  const notifications: Notification[] = [
    {
      id: 1,
      title: "New Assignment Posted",
      message: "Surah Al-Fatiha memorization assignment has been posted for your course.",
      type: "assignment",
      isRead: false,
      createdAt: "2025-06-15T10:30:00Z",
      priority: "high"
    },
    {
      id: 2,
      title: "Class Reminder",
      message: "Your Quran Memorization class starts in 30 minutes.",
      type: "reminder",
      isRead: false,
      createdAt: "2025-06-15T08:30:00Z",
      priority: "medium"
    },
    {
      id: 3,
      title: "Attendance Marked",
      message: "Your attendance has been marked for today's Islamic History class.",
      type: "attendance",
      isRead: true,
      createdAt: "2025-06-14T14:00:00Z",
      priority: "low"
    },
    {
      id: 4,
      title: "Grade Updated",
      message: "Your grade for Arabic Grammar Quiz has been updated to 85%.",
      type: "grade",
      isRead: true,
      createdAt: "2025-06-14T12:15:00Z",
      priority: "medium"
    },
    {
      id: 5,
      title: "School Announcement",
      message: "Eid celebration will be held on June 20th. All students and parents are invited.",
      type: "announcement",
      isRead: false,
      createdAt: "2025-06-13T16:00:00Z",
      priority: "medium"
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'attendance':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'grade':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'announcement':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout title="Notifications">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your latest activities and announcements
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No notifications found
                </h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {filter === 'unread' ? 'All notifications have been read' : 
                   filter === 'read' ? 'No read notifications' : 
                   'You have no notifications at this time'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.isRead ? 'border-l-4 border-l-primary bg-muted/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Button size="sm" variant="outline">
                            Mark as Read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions for Different User Roles */}
        {user?.role === 'parent' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Parent Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  View Child's Progress
                </Button>
                <Button variant="outline" size="sm">
                  Contact Teacher
                </Button>
                <Button variant="outline" size="sm">
                  Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === 'teacher' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Teacher Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  Create Announcement
                </Button>
                <Button variant="outline" size="sm">
                  Send Parent Update
                </Button>
                <Button variant="outline" size="sm">
                  Grade Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

export default NotificationsPage;