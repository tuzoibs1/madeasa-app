import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, User } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Submission, Assignment } from "@shared/schema";

export default function SubmissionsPage() {
  const { assignmentId } = useParams();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ['/api/assignments', assignmentId],
    queryFn: async () => {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      if (!res.ok) throw new Error('Failed to fetch assignment details');
      return res.json() as Promise<Assignment>;
    }
  });
  
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/assignments', assignmentId, 'submissions'],
    queryFn: async () => {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json() as Promise<Submission[]>;
    }
  });
  
  const gradeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubmission) return;
      
      const res = await fetch(`/api/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, feedback }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to grade submission');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission graded",
        description: "The submission has been graded successfully."
      });
      setSelectedSubmission(null);
      setGrade(0);
      setFeedback("");
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'submissions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Grading failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || "");
  };
  
  const handleSubmitGrade = () => {
    if (grade < 0 || grade > (assignment?.totalPoints || 100)) {
      toast({
        title: "Invalid grade",
        description: `Grade must be between 0 and ${assignment?.totalPoints || 100}`,
        variant: "destructive"
      });
      return;
    }
    
    gradeMutation.mutate();
  };
  
  if (isLoadingAssignment || isLoadingSubmissions) {
    return (
      <Layout title="Assignment Submissions">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={assignment ? `Submissions: ${assignment.title}` : "Assignment Submissions"}>
      <div className="space-y-6">
        {assignment && (
          <div className="bg-muted p-4 rounded-lg">
            <h2 className="text-2xl font-bold">{assignment.title}</h2>
            <p className="text-muted-foreground mt-1">{assignment.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium">Total Points: {assignment.totalPoints}</span>
              {assignment.dueDate && (
                <span className="text-sm font-medium">
                  Due: {format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}
                </span>
              )}
              {!assignment.dueDate && (
                <span className="text-sm font-medium">No due date</span>
              )}
            </div>
          </div>
        )}
        
        <h3 className="text-xl font-semibold">Student Submissions</h3>
        
        {submissions && submissions.length > 0 ? (
          <div className="grid gap-4">
            {submissions.map((submission) => {
              const statusColor = 
                submission.status === 'graded' ? 'success' : 
                submission.status === 'returned' ? 'warning' : 'default';
              
              return (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <User className="mr-2 h-5 w-5" />
                          Student ID: {submission.studentId}
                        </CardTitle>
                        <CardDescription>
                          Submitted: {submission.submittedAt ? format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                        </CardDescription>
                      </div>
                      <Badge variant={statusColor as any}>
                        {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-3">
                      <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        {submission.fileType.toUpperCase()} file 
                        ({(submission.fileSize / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    
                    {submission.comments && (
                      <div className="mt-2">
                        <Label>Student Comments</Label>
                        <p className="mt-1 text-sm bg-muted p-2 rounded">{submission.comments}</p>
                      </div>
                    )}
                    
                    {submission.status === 'graded' && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <Label>Grade</Label>
                          <span className="font-medium">
                            {submission.grade} / {assignment?.totalPoints}
                          </span>
                        </div>
                        {submission.feedback && (
                          <div>
                            <Label>Feedback</Label>
                            <p className="mt-1 text-sm bg-muted p-2 rounded">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <a 
                        href={`/api/files/submissions/${submission.filePath.split('/').pop()}`} 
                        download
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    
                    {submission.status !== 'graded' ? (
                      <Button onClick={() => openGradeDialog(submission)}>
                        Grade Submission
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => openGradeDialog(submission)}>
                        Update Grade
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 bg-muted rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No submissions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Students haven't submitted their assignments yet.
            </p>
          </div>
        )}
      </div>
      
      {/* Grading Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission?.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="grade">Grade (out of {assignment?.totalPoints})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={assignment?.totalPoints}
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide feedback to the student"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitGrade} disabled={gradeMutation.isPending}>
              {gradeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedSubmission?.status === 'graded' ? 'Update' : 'Submit'} Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}