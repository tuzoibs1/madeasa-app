import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Redirect } from "wouter";
import MobileAppShell from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Loader2, Book, Calendar, Clock } from "lucide-react";

export default function LessonsMobile() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Redirect to desktop view if not on mobile
  if (!isMobile) {
    return <Redirect to="/lessons" />;
  }
  
  // Define lesson type
  interface Lesson {
    id: number;
    title: string;
    description: string;
    date: string;
    duration: number;
  }
  
  // Fetch lessons data
  const { data: lessons, isLoading, error } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
    retry: false,
  });
  
  if (isLoading) {
    return (
      <MobileAppShell title="Lessons" showBackButton>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileAppShell>
    );
  }
  
  // Initialize with empty array if no data is available
  const lessonItems: Lesson[] = lessons || [];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <MobileAppShell title="Lessons" showBackButton>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-3">Your Lessons</h2>
        
        {lessonItems.map((lesson) => (
          <MobileCard 
            key={lesson.id} 
            to={`/lessons/${lesson.id}`} 
            className="border-l-4 border-l-green-500"
          >
            <div className="flex-1">
              <h3 className="font-medium">{lesson.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                {lesson.description}
              </p>
              <div className="flex items-center mt-2 text-xs text-slate-400 space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(lesson.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatTime(lesson.date)}</span>
                </div>
                <div className="flex items-center">
                  <Book className="h-3 w-3 mr-1" />
                  <span>{lesson.duration} min</span>
                </div>
              </div>
            </div>
          </MobileCard>
        ))}
        
        {lessonItems.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Book className="h-12 w-12 mx-auto text-slate-300 mb-2" />
            <h3 className="text-lg font-medium">No lessons found</h3>
            <p className="text-slate-500 mt-1">
              There are no lessons assigned to you yet.
            </p>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}