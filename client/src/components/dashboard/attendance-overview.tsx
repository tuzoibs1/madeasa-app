import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AttendanceOverviewProps {
  courseId?: number;
}

interface LowAttendanceClass {
  id: number;
  name: string;
  time: string;
  rate: number;
}

export default function AttendanceOverview({ courseId }: AttendanceOverviewProps) {
  // Fetch attendance data
  const { data: attendanceStats, isLoading } = useQuery<{
    presentPercentage: number;
    presentCount: number;
    absentCount: number;
    lowAttendanceClasses: LowAttendanceClass[];
  }>({
    queryKey: ["/api/stats", "attendance", courseId],
    // Mock data for now
    queryFn: async () => ({
      presentPercentage: 85,
      presentCount: 208,
      absentCount: 37,
      lowAttendanceClasses: [
        {
          id: 1,
          name: "Islamic Studies Class",
          time: "Tue 10:00 - 11:30 AM",
          rate: 70
        },
        {
          id: 2,
          name: "Intermediate Quran Class",
          time: "Wed 2:00 - 3:30 PM",
          rate: 75
        }
      ]
    })
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center flex-wrap">
          <CardTitle className="text-lg font-bold">Today's Attendance</CardTitle>
          {!isLoading && attendanceStats && (
            <div className="text-sm font-medium text-slate-500">
              <span className="text-success">Present: {attendanceStats.presentPercentage}%</span> | 
              <span className="text-destructive ml-1">Absent: {100 - attendanceStats.presentPercentage}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-full mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-4 w-1/3 mb-3" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : attendanceStats ? (
          <>
            <div className="mb-4">
              <Progress value={attendanceStats.presentPercentage} className="h-3 mb-3" />
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <h4 className="text-2xl font-bold text-success">{attendanceStats.presentCount}</h4>
                  <p className="text-xs text-slate-500">Present Students</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <h4 className="text-2xl font-bold text-destructive">{attendanceStats.absentCount}</h4>
                  <p className="text-xs text-slate-500">Absent Students</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-3">Classes with Low Attendance</h4>
              <div className="space-y-2">
                {attendanceStats.lowAttendanceClasses.map((cls) => (
                  <div key={cls.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{cls.name}</p>
                      <p className="text-xs text-slate-500">{cls.time}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        cls.rate < 75 
                          ? "bg-red-100 text-destructive border-red-200" 
                          : "bg-amber-100 text-warning border-amber-200"
                      } text-xs px-2 py-1 font-medium`}
                    >
                      {cls.rate}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 text-center pt-3 border-t border-slate-100">
              <a href="/attendance" className="text-primary text-sm font-medium hover:underline">View Full Attendance Log</a>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No attendance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
