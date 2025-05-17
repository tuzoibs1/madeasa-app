import { UserPlus, BookOpen, CalendarPlus, FileText, Settings, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  hoverColor: string;
  onClick: () => void;
}

function QuickAction({ icon, label, color, hoverColor, onClick }: QuickActionProps) {
  return (
    <Button
      className={`${color} text-white p-3 rounded-lg hover:${hoverColor} transition flex flex-col items-center justify-center h-24`}
      onClick={onClick}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <span className="text-sm">{label}</span>
    </Button>
  );
}

export default function QuickActions() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const isDirector = user?.role === "director";
  const isTeacher = user?.role === "teacher";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {(isDirector || isTeacher) && (
            <QuickAction
              icon={<UserPlus size={24} />}
              label="Add Student"
              color="bg-primary"
              hoverColor="bg-primary-dark"
              onClick={() => navigate("/students/new")}
            />
          )}
          
          {isDirector && (
            <QuickAction
              icon={<User size={24} />}
              label="Add Teacher"
              color="bg-secondary"
              hoverColor="bg-secondary-dark"
              onClick={() => navigate("/teachers/new")}
            />
          )}
          
          {(isDirector || isTeacher) && (
            <QuickAction
              icon={<BookOpen size={24} />}
              label="New Course"
              color="bg-accent"
              hoverColor="bg-accent-dark"
              onClick={() => navigate("/courses/new")}
            />
          )}
          
          <QuickAction
            icon={<CalendarPlus size={24} />}
            label="Schedule"
            color="bg-blue-500"
            hoverColor="bg-blue-600"
            onClick={() => navigate("/schedule")}
          />
          
          {(isDirector || isTeacher) && (
            <QuickAction
              icon={<FileText size={24} />}
              label="Reports"
              color="bg-success"
              hoverColor="bg-green-600"
              onClick={() => navigate("/reports")}
            />
          )}
          
          <QuickAction
            icon={<Settings size={24} />}
            label="Settings"
            color="bg-slate-600"
            hoverColor="bg-slate-700"
            onClick={() => navigate("/settings")}
          />
        </div>
        
        <div className="mt-6 bg-amber-50 rounded-lg p-4">
          <div className="flex items-start">
            <div className="bg-warning rounded-full p-2 text-white mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-sm">End of Term Reminder</h4>
              <p className="text-xs text-slate-600 mt-1">
                Term exams begin in 2 weeks. Ensure all teachers have submitted their assessments.
              </p>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto mt-2">
                View Submission Status
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
