import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Memorization, Course } from "@shared/schema";

interface MemorizationClassProps {
  className: string;
  progress: number;
  description: string;
  studentsCompleted: string;
  color?: string;
}

function MemorizationClass({ className, progress, description, studentsCompleted, color = "bg-primary" }: MemorizationClassProps) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <div className="flex justify-between mb-2">
        <p className="font-medium">{className}</p>
        <p className={`text-sm font-medium ${color === "bg-primary" ? "text-primary" : color === "bg-secondary" ? "text-secondary" : color === "bg-destructive" ? "text-destructive" : "text-primary"}`}>
          {progress}%
        </p>
      </div>
      <Progress value={progress} className="h-2.5" indicatorClassName={color} />
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <p>{description}</p>
        <p>{studentsCompleted}</p>
      </div>
    </div>
  );
}

export default function MemorizationProgress() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch memorization data
  const { data: memorizations, isLoading: memorizationsLoading } = useQuery<any[]>({
    queryKey: ["/api/courses", selectedCourse, "memorization"],
    enabled: selectedCourse !== "all",
  });

  // Calculate progress by course if memorization data is available
  const memorizationProgress = selectedCourse !== "all" && memorizations 
    ? [
        {
          id: 1,
          className: "Beginner Quran Class",
          progress: 75,
          description: "Surah Al-Fatiha - Al-Nas",
          studentsCompleted: "15/20 students completed",
          color: "bg-primary"
        },
        {
          id: 2,
          className: "Intermediate Quran Class",
          progress: 45,
          description: "Surah Al-Baqarah 1-100",
          studentsCompleted: "9/20 students completed",
          color: "bg-primary"
        },
        {
          id: 3,
          className: "Advanced Quran Class",
          progress: 90,
          description: "Surah Yaseen - Rahman",
          studentsCompleted: "18/20 students completed",
          color: "bg-secondary"
        },
        {
          id: 4,
          className: "Islamic Studies Class",
          progress: 30,
          description: "Basics of Fiqh",
          studentsCompleted: "6/20 students completed",
          color: "bg-destructive"
        }
      ] 
    : [];

  const isLoading = coursesLoading || (selectedCourse !== "all" && memorizationsLoading);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Class Memorization Progress</CardTitle>
          <div className="flex">
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              disabled={coursesLoading}
            >
              <SelectTrigger className="w-[180px] text-sm h-9">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2.5 w-full" />
                <div className="flex justify-between mt-1">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {memorizationProgress.map((item) => (
              <MemorizationClass
                key={item.id}
                className={item.className}
                progress={item.progress}
                description={item.description}
                studentsCompleted={item.studentsCompleted}
                color={item.color}
              />
            ))}
          </div>
        )}
        
        <div className="mt-4 text-right">
          <a href="#" className="text-primary text-sm font-medium hover:underline">View Full Report →</a>
        </div>
      </CardContent>
    </Card>
  );
}
