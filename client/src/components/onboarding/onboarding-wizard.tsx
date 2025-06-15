import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { 
  BookOpen, 
  Calendar, 
  Bookmark, 
  Users, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  UserCog 
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Welcome",
    description: "Welcome to the Islamic Studies Learning Platform",
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>
          Assalamu alaikum! Welcome to our comprehensive Islamic Studies Learning Platform.
          This quick tour will help you get familiar with the key features available to you.
        </p>
        <p>
          Our platform is designed to support your journey in Islamic education with tools
          for tracking attendance, memorization progress, and course management.
        </p>
      </div>
    )
  },
  {
    id: 2,
    title: "Dashboard",
    description: "Your personalized dashboard",
    icon: <Award className="h-10 w-10 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>
          Your dashboard provides a quick overview of your most important information.
          Depending on your role, you'll see different widgets and statistics relevant to you.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Quick access to your courses and recent activities</li>
          <li>Important statistics and progress indicators</li>
          <li>Upcoming events and announcements</li>
        </ul>
      </div>
    )
  },
  {
    id: 3,
    title: "Attendance",
    description: "Track and manage attendance",
    icon: <Calendar className="h-10 w-10 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>
          Our attendance system makes it easy to track student presence in classes.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>For Teachers:</strong> Record attendance with a simple interface</li>
          <li><strong>For Students:</strong> View your attendance history and current status</li>
          <li><strong>For Parents:</strong> Monitor your child's attendance across all classes</li>
          <li><strong>For Directors:</strong> Access comprehensive attendance reports</li>
        </ul>
      </div>
    )
  },
  {
    id: 4,
    title: "Memorization",
    description: "Track Quran memorization progress",
    icon: <Bookmark className="h-10 w-10 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>
          Our Quran memorization tracking system helps students, teachers, and parents monitor progress.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Track memorization by surah, juz, or custom sections</li>
          <li>Visual progress indicators show how much has been completed</li>
          <li>Record quality and retention alongside completion</li>
          <li>Set goals and celebrate achievements</li>
        </ul>
      </div>
    )
  },
  {
    id: 5,
    title: "User Profiles",
    description: "Manage your personal profile",
    icon: <UserCog className="h-10 w-10 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>
          Keep your profile information up to date to get the most out of the platform.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Update your personal information and contact details</li>
          <li>Manage notification preferences</li>
          <li>Change your password and security settings</li>
          <li>Customize your user experience</li>
        </ul>
      </div>
    )
  },
  {
    id: 6,
    title: "Complete!",
    description: "You're all set to get started",
    icon: <CheckCircle2 className="h-10 w-10 text-success" />,
    content: (
      <div className="space-y-4">
        <p>
          Congratulations! You've completed the onboarding tour and are ready to use the
          Islamic Studies Learning Platform.
        </p>
        <p>
          You can access this guide anytime from the help menu if you need a refresher.
          We hope this platform helps you in your journey of Islamic learning.
        </p>
        <p className="font-medium">
          Jazakallahu Khairan for joining us!
        </p>
      </div>
    )
  }
];

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { user } = useAuth();
  const totalSteps = steps.length;
  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (currentStep / totalSteps) * 100;

  // Check if this is the first login for the user
  useEffect(() => {
    // Check if user has completed onboarding and their dismissal preference
    const hasSeenOnboarding = localStorage.getItem(`onboarding-completed-${user?.id}`);
    const hasDismissedPermanently = localStorage.getItem(`onboarding-dismissed-${user?.id}`);
    
    // Only show if user hasn't seen it and hasn't permanently dismissed it
    if (user && !hasSeenOnboarding && !hasDismissedPermanently) {
      setOpen(true);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed
      if (user) {
        localStorage.setItem(`onboarding-completed-${user.id}`, 'true');
        // If user checked "don't show again", save that preference
        if (dontShowAgain) {
          localStorage.setItem(`onboarding-dismissed-${user.id}`, 'true');
        }
      }
      setOpen(false);
    }
  };

  const handleSkip = () => {
    // Mark onboarding as completed
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, 'true');
      // If user checked "don't show again", save that preference
      if (dontShowAgain) {
        localStorage.setItem(`onboarding-dismissed-${user.id}`, 'true');
      }
    }
    setOpen(false);
  };

  // Force the dialog to open (for demonstration)
  const startOnboarding = () => {
    setCurrentStep(1);
    setOpen(true);
  };

  return (
    <>
      {/* Button to manually open the onboarding wizard (for testing) */}
      <Button 
        variant="outline" 
        onClick={startOnboarding}
        className="hidden"
      >
        Start Onboarding
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              {currentStepData?.icon}
            </div>
            <DialogTitle className="text-center text-2xl">
              {currentStepData?.title}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {currentStepData?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {currentStepData?.content}
          </div>

          <div className="mt-2 mb-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4 pb-2">
            <Checkbox 
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this guide again
            </label>
          </div>

          <DialogFooter className="flex sm:justify-between">
            {currentStep < totalSteps ? (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            ) : (
              <div></div> // Empty div for layout
            )}
            
            <Button onClick={handleNext} className="gap-2">
              {currentStep < totalSteps ? (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}