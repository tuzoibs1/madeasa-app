import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Redirect } from "wouter";
import MobileAppShell from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Loader2, BookOpen, Award, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Memorization {
  id: number;
  title: string;
  totalVerses: number;
  memorizedVerses: number;
  lastReviewed: string;
  nextReview: string;
}

export default function MemorizationMobile() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Fetch memorization data - always call hooks before any conditional returns
  const { data: memorizations, isLoading } = useQuery<Memorization[]>({
    queryKey: ['/api/memorization'],
    retry: false,
  });
  
  // Redirect to desktop view if not on mobile (after all hooks)
  if (!isMobile) {
    return <Redirect to="/memorization" />;
  }
  
  if (isLoading) {
    return (
      <MobileAppShell title="Memorization" showBackButton>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileAppShell>
    );
  }
  
  // Initialize with empty array if no data is available
  const memorizationItems: Memorization[] = memorizations || [];
  
  // Add sample data for demo if no data available
  if (memorizationItems.length === 0) {
    memorizationItems.push(
      {
        id: 1,
        title: "Surah Al-Fatiha",
        totalVerses: 7,
        memorizedVerses: 7,
        lastReviewed: "2023-05-15T14:00:00Z",
        nextReview: "2023-05-20T14:00:00Z"
      },
      {
        id: 2,
        title: "Surah Al-Ikhlas",
        totalVerses: 4,
        memorizedVerses: 4,
        lastReviewed: "2023-05-10T10:30:00Z",
        nextReview: "2023-05-18T10:30:00Z"
      },
      {
        id: 3,
        title: "Surah Al-Baqarah (1-20)",
        totalVerses: 20,
        memorizedVerses: 12,
        lastReviewed: "2023-05-12T16:15:00Z",
        nextReview: "2023-05-19T16:15:00Z"
      }
    );
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  const calculateProgress = (memorized: number, total: number) => {
    return Math.round((memorized / total) * 100);
  };
  
  return (
    <MobileAppShell title="Memorization" showBackButton>
      <div className="space-y-6">
        {/* Summary card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white shadow-md">
          <h2 className="text-xl font-bold mb-2">Your Progress</h2>
          
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Total Memorized</span>
            <span className="text-sm font-medium">
              {memorizationItems.reduce((total, item) => total + item.memorizedVerses, 0)} verses
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">Target Completion</span>
            <span className="text-sm font-medium">Week 10</span>
          </div>
          
          <Progress 
            value={65} 
            className="h-2 bg-white/20" 
          />
        </div>
        
        {/* Memorization list */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Assignments</h3>
          
          <div className="space-y-3">
            {memorizationItems.map((item) => (
              <MobileCard 
                key={item.id} 
                to={`/memorization/${item.id}`}
                className="border-l-4 border-l-indigo-500"
              >
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {item.memorizedVerses}/{item.totalVerses} verses
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <Progress 
                      value={calculateProgress(item.memorizedVerses, item.totalVerses)} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Last: {formatDate(item.lastReviewed)}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      <span>Next: {formatDate(item.nextReview)}</span>
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>
        
        {/* Achievement badges */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Achievements</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <span className="text-xs text-center">First Surah</span>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-xs text-center">Perfect Tajweed</span>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm flex flex-col items-center opacity-50">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-xs text-center">10 Day Streak</span>
            </div>
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}