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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, UserPlus, BookOpen, ChevronRight } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["director", "teacher", "student"], {
    required_error: "Please select a role",
  }),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Initialize login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Initialize registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "student",
    },
  });

  // Handle login form submission
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Handle registration form submission
  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(values);
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
            <h1 className="ml-3 text-2xl font-bold text-primary">Islamic Studies</h1>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                {activeTab === "login" ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login"
                  ? "Enter your credentials to sign in"
                  : "Fill in your details to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
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
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="Enter your password"
                                disabled={loginMutation.isPending} 
                              />
                            </FormControl>
                            <FormMessage />
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
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter your full name"
                                disabled={registerMutation.isPending} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Choose a username"
                                disabled={registerMutation.isPending} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="Create a password"
                                disabled={registerMutation.isPending} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Role</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                type="button"
                                variant={field.value === "student" ? "default" : "outline"}
                                className={field.value === "student" ? "bg-primary" : ""}
                                onClick={() => field.onChange("student")}
                                disabled={registerMutation.isPending}
                              >
                                Student
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === "teacher" ? "default" : "outline"}
                                className={field.value === "teacher" ? "bg-primary" : ""}
                                onClick={() => field.onChange("teacher")}
                                disabled={registerMutation.isPending}
                              >
                                Teacher
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === "director" ? "default" : "outline"}
                                className={field.value === "director" ? "bg-primary" : ""}
                                onClick={() => field.onChange("director")}
                                disabled={registerMutation.isPending}
                              >
                                Director
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side: Hero section */}
      <div className="hidden md:flex md:w-1/2 bg-primary text-white">
        <div className="flex flex-col justify-center p-12 lg:p-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Islamic Studies Learning Platform
          </h2>
          <p className="text-lg opacity-90 mb-8">
            A comprehensive platform for Islamic education with personalized tracking, attendance management, and Quran memorization progress.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 rounded-full p-2">
                <UserPlus className="h-6 w-6" />
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
            <a href="#" className="flex items-center text-white hover:underline group">
              <span className="font-semibold">Learn more about our platform</span>
              <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
