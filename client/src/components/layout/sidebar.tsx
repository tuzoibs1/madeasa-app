import { useLocation, Link } from "wouter";
import { 
  Home, 
  Book, 
  CheckSquare, 
  Users, 
  Calendar, 
  HelpCircle, 
  UserPlus, 
  Settings,
  LogOut,
  BarChart3,
  TestTube,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "bg-white shadow-md fixed h-screen z-50 w-64 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-slate-200 flex items-center">
          <div className="rounded-full bg-primary w-10 h-10 flex items-center justify-center text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <h1 className="ml-3 text-xl font-bold text-primary">Islamic Studies</h1>
        </div>

        <div className="overflow-y-auto flex-grow h-[calc(100vh-180px)]">
          {/* Main menu section */}
          <div className="pt-6 pb-2 px-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              MAIN MENU
            </p>
          </div>

          <nav className="space-y-1">
            {user?.role === "company_admin" && (
              <Link to="/company-admin">
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                    isActive("/company-admin") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                  )}
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  <span>Company Admin</span>
                </a>
              </Link>
            )}

            {user?.role === "director" && (
              <Link to="/">
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                    isActive("/") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                  )}
                >
                  <Home className="w-5 h-5 mr-2" />
                  <span>Dashboard</span>
                </a>
              </Link>
            )}

            {user?.role === "teacher" && (
              <Link to="/teacher">
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                    isActive("/teacher") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                  )}
                >
                  <Home className="w-5 h-5 mr-2" />
                  <span>Dashboard</span>
                </a>
              </Link>
            )}

            {user?.role === "student" && (
              <Link to="/student">
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                    isActive("/student") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                  )}
                >
                  <Home className="w-5 h-5 mr-2" />
                  <span>Dashboard</span>
                </a>
              </Link>
            )}

            <Link to="/lessons">
              <a
                className={cn(
                  "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                  isActive("/lessons") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                )}
              >
                <Book className="w-5 h-5 mr-2" />
                <span>Lessons</span>
              </a>
            </Link>

            <Link to="/memorization">
              <a
                className={cn(
                  "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                  isActive("/memorization") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                )}
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                <span>Memorization</span>
              </a>
            </Link>

            {(user?.role === "director" || user?.role === "teacher") && (
              <Link to="/attendance">
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                    isActive("/attendance") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                  )}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Attendance</span>
                </a>
              </Link>
            )}

            {/* Administration section for directors/teachers */}
            {(user?.role === "director" || user?.role === "teacher") && (
              <>
                <div className="pt-6 pb-2 px-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    ADMINISTRATION
                  </p>
                </div>

                <Link to="/students">
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                      isActive("/students") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                    )}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    <span>Students</span>
                  </a>
                </Link>

                {user?.role === "director" && (
                  <Link to="/teachers">
                    <a
                      className={cn(
                        "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                        isActive("/teachers") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                      )}
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      <span>Teachers</span>
                    </a>
                  </Link>
                )}
              </>
            )}

            {/* Company Admin QA Access */}
            {user?.role === "company_admin" && (
              <>
                <div className="pt-6 pb-2 px-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    ENTERPRISE TOOLS
                  </p>
                </div>

                <Link to="/qa">
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                      isActive("/qa") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                    )}
                  >
                    <TestTube className="w-5 h-5 mr-2" />
                    <span>QA Testing</span>
                  </a>
                </Link>
              </>
            )}

            {/* Analytics and Settings */}
            {(user?.role === "director" || user?.role === "teacher") && (
              <>
                <Link to="/analytics">
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                      isActive("/analytics") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                    )}
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    <span>Analytics</span>
                  </a>
                </Link>

                <Link to="/settings">
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50",
                      isActive("/settings") && "bg-primary bg-opacity-10 border-l-3 border-primary text-primary"
                    )}
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    <span>Settings</span>
                  </a>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-200 absolute bottom-0 w-full">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user?.profilePicture || undefined} />
              <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "US"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-slate-400 hover:text-slate-600"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
