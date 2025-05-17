import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Course } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface EnrollmentWithUser {
  id: number;
  enrollmentDate: string;
  student: User;
  course: Course;
}

export default function RecentEnrollments() {
  // Fetch recent enrollments
  const { data: enrollments, isLoading } = useQuery<EnrollmentWithUser[]>({
    queryKey: ["/api/enrollments/recent"],
    // Mock data for now
    queryFn: async () => [
      {
        id: 1,
        enrollmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        student: {
          id: 1,
          username: "ibrahim",
          fullName: "Ibrahim Ahmed",
          role: "student",
          password: "",
          profilePicture: "",
          createdAt: ""
        },
        course: {
          id: 1,
          name: "Beginner Quran Class",
          description: "",
          teacherId: 1,
          createdAt: ""
        }
      },
      {
        id: 2,
        enrollmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        student: {
          id: 2,
          username: "fatima",
          fullName: "Fatima Mohammad",
          role: "student",
          password: "",
          profilePicture: "",
          createdAt: ""
        },
        course: {
          id: 2,
          name: "Islamic Studies Class",
          description: "",
          teacherId: 1,
          createdAt: ""
        }
      },
      {
        id: 3,
        enrollmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        student: {
          id: 3,
          username: "yusuf",
          fullName: "Yusuf Ali",
          role: "student",
          password: "",
          profilePicture: "",
          createdAt: ""
        },
        course: {
          id: 3,
          name: "Advanced Quran Class",
          description: "",
          teacherId: 2,
          createdAt: ""
        }
      },
      {
        id: 4,
        enrollmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        student: {
          id: 4,
          username: "aisha",
          fullName: "Aisha Khan",
          role: "student",
          password: "",
          profilePicture: "",
          createdAt: ""
        },
        course: {
          id: 4,
          name: "Intermediate Quran Class",
          description: "",
          teacherId: 2,
          createdAt: ""
        }
      }
    ]
  });

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  function getTimeAgo(date: string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Recent Enrollments</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary font-medium">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center">
                <Avatar>
                  <AvatarImage src={enrollment.student.profilePicture || ""} />
                  <AvatarFallback>{getInitials(enrollment.student.fullName)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h4 className="font-medium text-sm">{enrollment.student.fullName}</h4>
                  <p className="text-xs text-slate-500">{enrollment.course.name}</p>
                </div>
                <div className="ml-auto text-xs text-slate-400">
                  {getTimeAgo(enrollment.enrollmentDate)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No recent enrollments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
