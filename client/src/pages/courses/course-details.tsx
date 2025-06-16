import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import MaterialList from "@/components/materials/material-list";
import AssignmentList from "@/components/assignments/assignment-list";
import { Course } from "@shared/schema";

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState("materials");
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course details');
      return res.json() as Promise<Course>;
    }
  });

  if (isLoading) {
    return (
      <Layout title="Course Details">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout title="Course Details">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <h3 className="text-lg font-semibold">Error loading course</h3>
          <p>{(error as Error)?.message || "Course not found"}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={course.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground mt-2">{course.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {course.startDate && (
              <div>
                <span className="font-medium">Start Date:</span>{" "}
                {new Date(course.startDate).toLocaleDateString()}
              </div>
            )}
            {course.endDate && (
              <div>
                <span className="font-medium">End Date:</span>{" "}
                {new Date(course.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials" className="mt-6">
            <MaterialList />
          </TabsContent>
          
          <TabsContent value="assignments" className="mt-6">
            <AssignmentList />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}