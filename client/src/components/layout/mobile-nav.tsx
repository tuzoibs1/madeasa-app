import { Link, useLocation } from "wouter";
import { Home, Book, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Check if current route is active
  const isActive = (path: string) => {
    return location === path;
  };

  // Get base path based on user role
  const getBasePath = () => {
    if (user?.role === "director") return "/";
    if (user?.role === "teacher") return "/teacher";
    if (user?.role === "student") return "/student";
    return "/";
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 border-t border-slate-200">
        <Link to={getBasePath()}>
          <a
            className={cn(
              "flex flex-col items-center justify-center",
              isActive(getBasePath()) ? "text-primary" : "text-slate-400"
            )}
          >
            <Home className="text-xl mb-1" />
            <span className="text-xs">Dashboard</span>
          </a>
        </Link>

        <Link to="/lessons">
          <a
            className={cn(
              "flex flex-col items-center justify-center",
              isActive("/lessons") ? "text-primary" : "text-slate-400"
            )}
          >
            <Book className="text-xl mb-1" />
            <span className="text-xs">Lessons</span>
          </a>
        </Link>

        <Link to="/memorization">
          <a
            className={cn(
              "flex flex-col items-center justify-center",
              isActive("/memorization") ? "text-primary" : "text-slate-400"
            )}
          >
            <CheckSquare className="text-xl mb-1" />
            <span className="text-xs">Memorization</span>
          </a>
        </Link>

        <Link to="/profile">
          <a
            className={cn(
              "flex flex-col items-center justify-center",
              isActive("/profile") ? "text-primary" : "text-slate-400"
            )}
          >
            <User className="text-xl mb-1" />
            <span className="text-xs">Profile</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
