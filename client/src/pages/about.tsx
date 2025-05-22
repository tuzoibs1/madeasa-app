import { Link } from "wouter";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Book, Users, Calendar, Award, CheckSquare, Star, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout title="About MadrasaApp">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text mb-2">
            Welcome to MadrasaApp
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            A comprehensive Islamic Studies Learning Platform for students, teachers, and administrators
          </p>
        </div>

        <Tabs defaultValue="platform" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="platform">Our Platform</TabsTrigger>
            <TabsTrigger value="features">Key Features</TabsTrigger>
            <TabsTrigger value="goals">Our Goals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="platform">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">About Our Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  MadrasaApp is an advanced Islamic Studies Learning Platform designed to provide a comprehensive
                  and engaging educational ecosystem for students, teachers, and administrators. Our platform
                  combines traditional Islamic education with modern technology to create an effective and
                  immersive learning experience.
                </p>
                <p>
                  With our role-based access control, each user experiences a tailored interface designed
                  specifically for their needs - whether they're a student tracking their progress, a teacher
                  managing classes, or a director overseeing the entire institution.
                </p>
                <p>
                  We focus on creating a seamless experience across all devices, allowing users to access
                  the platform on desktops, tablets, and mobile phones with optimized interfaces for each device.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Interactive Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">
                    Engage with multimedia-rich lessons that combine text, audio, and visual elements for effective learning.
                    Our interactive approach keeps students motivated and improves retention.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg">Memorization Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">
                    Our advanced memorization tracking system helps students track their progress with Quran memorization
                    and other Islamic texts, with built-in revision scheduling and achievement badges.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Attendance Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">
                    Simplified attendance tracking for teachers with automated reports and insights. Parents
                    can monitor their children's attendance patterns and receive notifications for absences.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Parent Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">
                    Parents can stay involved with their children's Islamic education through our dedicated portal,
                    with access to progress reports, memorization status, and direct communication with teachers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Our Educational Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  At MadrasaApp, we believe in combining traditional Islamic education with modern teaching methods.
                  Our main goals are:
                </p>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Accessible Islamic Education</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Making quality Islamic education accessible to students regardless of location or schedule.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-indigo-500/10 p-2 rounded-full mr-3">
                      <Star className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Enhanced Student Engagement</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Using technology to create engaging, interactive learning experiences that motivate students.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-500/10 p-2 rounded-full mr-3">
                      <Star className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Comprehensive Progress Tracking</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Providing detailed insights into student progress for teachers, parents, and students themselves.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-emerald-500/10 p-2 rounded-full mr-3">
                      <Star className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Building Community</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Creating a connected ecosystem where students, teachers, and parents can collaborate effectively.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-indigo-500/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
              <p className="mb-6 max-w-lg mx-auto">
                Join thousands of students and teachers who are already using MadrasaApp
                to enhance their Islamic education journey.
              </p>
              <Button size="lg" asChild>
                <Link href="/auth">
                  Create an Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}