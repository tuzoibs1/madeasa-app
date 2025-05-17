import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 text-slate-600 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-medium">{title}</h1>
        </div>

        <div className="flex items-center">
          <div className="relative mr-4 hidden md:block">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-8 rounded-full h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          </div>

          <div className="relative mr-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
          </div>

          <div className="md:hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "US"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
