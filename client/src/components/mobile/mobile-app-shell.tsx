import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import MobileNav from "../layout/mobile-nav";

interface MobileAppShellProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

export default function MobileAppShell({
  children,
  title,
  showBackButton = false,
  backTo = "",
}: MobileAppShellProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const getBasePath = () => {
    if (user?.role === "director") return "/";
    if (user?.role === "teacher") return "/teacher";
    if (user?.role === "student") return "/student";
    return "/";
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(getBasePath());
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 md:hidden">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center h-14 px-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-medium flex-1 text-center">{title}</h1>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 p-4 pb-20">
        {children}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}