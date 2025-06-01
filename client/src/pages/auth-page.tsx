import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar, BookOpen, ChevronRight, Eye, EyeOff } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [location, navigate] = useLocation();
  const { user, loginMutation } = useAuth();

  // Initialize login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login form submission
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "director") {
        navigate("/");
      } else if (user.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/student");
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side: Auth forms */}
      <div className="flex flex-col justify-center p-4 md:p-8 lg:p-12 w-full md:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="rounded-full bg-primary w-10 h-10 flex items-center justify-center text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-primary">MadrasaApp</h1>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Welcome back
              </CardTitle>
              <CardDescription>
                Enter your credentials to sign in to MadrasaApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? (
                <ForgotPasswordForm onCancel={() => setShowForgotPassword(false)} />
              ) : (
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your username"
                              disabled={loginMutation.isPending} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showLoginPassword ? "text" : "password"} 
                                placeholder="Enter your password"
                                disabled={loginMutation.isPending} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showLoginPassword ? "Hide password" : "Show password"}
                                </span>
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <div className="text-right">
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-xs text-slate-500 hover:text-primary"
                              onClick={() => setShowForgotPassword(true)}
                              type="button"
                            >
                              Forgot password?
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Need an account? Contact your administrator to create one for you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side: Hero section */}
      <div className="hidden md:flex md:w-1/2 bg-primary text-white">
        <div className="flex flex-col justify-center p-12 lg:p-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            MadrasaApp
          </h2>
          <p className="text-lg opacity-90 mb-8">
            A comprehensive Islamic studies platform with personalized tracking, attendance management, and Quran memorization progress.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 rounded-full p-2">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">Role-Based Access</h3>
                <p className="opacity-80">
                  Customized dashboards for directors, teachers, and students
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 rounded-full p-2">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">Attendance Tracking</h3>
                <p className="opacity-80">
                  Monitor student attendance and generate reports
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 rounded-full p-2">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">Memorization Progress</h3>
                <p className="opacity-80">
                  Track Quran memorization and learning achievements
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-12">
            <a href="/about" className="flex items-center text-white hover:underline group">
              <span className="font-semibold">Learn more about our platform</span>
              <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}