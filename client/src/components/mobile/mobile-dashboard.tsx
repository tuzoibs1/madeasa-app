import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { MobileCard } from "./mobile-card";
import { 
  Book, 
  CheckSquare, 
  Calendar, 
  User, 
  Award, 
  Clock 
} from "lucide-react";

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  to: string;
}

function QuickAction({ icon, label, to }: QuickActionProps) {
  return (
    <MobileCard to={to} className="flex flex-col items-center justify-center p-4 h-24">
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </MobileCard>
  );
}

export default function MobileDashboard() {
  const { user } = useAuth();
  
  // Get actions based on user role
  const getQuickActions = () => {
    if (user?.role === "teacher") {
      return [
        { icon: <Calendar className="h-6 w-6 text-blue-500" />, label: "Attendance", to: "/attendance" },
        { icon: <Book className="h-6 w-6 text-green-500" />, label: "Lessons", to: "/lessons" },
        { icon: <CheckSquare className="h-6 w-6 text-purple-500" />, label: "Memorization", to: "/memorization" },
        { icon: <User className="h-6 w-6 text-orange-500" />, label: "Students", to: "/students" },
      ];
    }
    
    if (user?.role === "student") {
      return [
        { icon: <Book className="h-6 w-6 text-green-500" />, label: "Lessons", to: "/lessons" },
        { icon: <CheckSquare className="h-6 w-6 text-purple-500" />, label: "Memorization", to: "/memorization" },
        { icon: <Award className="h-6 w-6 text-amber-500" />, label: "Achievements", to: "/achievements" },
        { icon: <Clock className="h-6 w-6 text-blue-500" />, label: "Schedule", to: "/schedule" },
      ];
    }
    
    return [];
  };
  
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-5 shadow-md">
        <h2 className="text-xl font-bold mb-1">Welcome back, {user?.fullName?.split(' ')[0] || "User"}</h2>
        <p className="text-white/80">
          {user?.role === "teacher" 
            ? "You have classes scheduled today" 
            : "You have lessons to complete today"}
        </p>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-3">
          {getQuickActions().map((action, index) => (
            <QuickAction 
              key={index}
              icon={action.icon}
              label={action.label}
              to={action.to}
            />
          ))}
        </div>
      </div>
      
      {/* Recent activity */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-3">
          <MobileCard className="border-l-4 border-l-green-500">
            <div>
              <h4 className="font-medium">Lesson Completed</h4>
              <p className="text-sm text-slate-500">Surah Al-Fatiha</p>
              <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
            </div>
          </MobileCard>
          
          <MobileCard className="border-l-4 border-l-blue-500">
            <div>
              <h4 className="font-medium">New Assignment</h4>
              <p className="text-sm text-slate-500">Tajweed rules practice</p>
              <p className="text-xs text-slate-400 mt-1">Yesterday</p>
            </div>
          </MobileCard>
        </div>
      </div>
    </div>
  );
}