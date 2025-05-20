import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Assignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

const submissionSchema = z.object({
  assignmentId: z.number(),
  comments: z.string().optional(),
  file: z.instanceof(File, { message: "Please select a file" })
});

type SubmissionSchema = z.infer<typeof submissionSchema>;

interface AssignmentSubmissionFormProps {
  assignment: Assignment;
  onClose: () => void;
}

export function AssignmentSubmissionForm({ assignment, onClose }: AssignmentSubmissionFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const form = useForm<SubmissionSchema>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      assignmentId: assignment.id,
      comments: '',
    }
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: SubmissionSchema) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('assignmentId', data.assignmentId.toString());
      if (data.comments) {
        formData.append('comments', data.comments);
      }

      const res = await fetch('/api/assignments/submit', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit assignment');
      }

      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully."
      });
      form.reset();
      handleClose();
      queryClient.invalidateQueries({ queryKey: ['/api/students', 'submissions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SubmissionSchema) => {
    submitAssignmentMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('file', file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Assignment: {assignment.title}</DialogTitle>
          <DialogDescription>
            Upload your completed assignment. Be sure to review your work before submitting.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any comments or notes about your submission" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>Upload Assignment File</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      onChange={handleFileChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitAssignmentMutation.isPending}>
                {submitAssignmentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}