import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import TopBar from "./topbar";
import MobileNav from "./mobile-nav";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar for desktop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <main className="flex-1 pb-16 md:pb-0 md:ml-64">
        <TopBar title={title} onMenuClick={toggleSidebar} />
        
        <div className="p-4 md:p-6">
          {children}
        </div>
        
        <footer className="mt-10 text-center text-sm text-slate-500 pb-20 md:pb-6">
          <p>© {new Date().getFullYear()} Islamic Studies Learning Platform. All rights reserved.</p>
        </footer>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
