import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Material } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileIcon, DownloadIcon, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";

const uploadSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  file: z.instanceof(File, { message: "Please select a file" })
});

type UploadSchema = z.infer<typeof uploadSchema>;

export default function MaterialList() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const isTeacherOrDirector = user?.role === 'teacher' || user?.role === 'director';

  const { data: materials, isLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'materials'],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (!res.ok) throw new Error('Failed to fetch materials');
      return res.json() as Promise<Material[]>;
    }
  });

  const form = useForm<UploadSchema>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      courseId: courseId || '',
      title: '',
      description: '',
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadSchema) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('courseId', data.courseId);
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }

      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload material');
      }

      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Material uploaded",
        description: "Your material has been uploaded successfully."
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'materials'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: UploadSchema) => {
    uploadMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('file', file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Materials</h2>
        {isTeacherOrDirector && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Material</DialogTitle>
                <DialogDescription>
                  Upload study materials for students in this course.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Material title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe this material" {...field} />
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
                        <FormLabel>File</FormLabel>
                        <FormControl>
                          <Input type="file" onChange={handleFileChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Upload
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {materials && materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileIcon className="mr-2 h-5 w-5" />
                  {material.title}
                </CardTitle>
                <CardDescription>
                  {material.createdAt ? new Date(material.createdAt).toLocaleDateString() : "Unknown date"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{material.description || 'No description provided'}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {(material.fileSize / 1024).toFixed(2)}KB • {material.fileType.toUpperCase()}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/files/materials/${material.filePath.split('/').pop()}`} download>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-muted rounded-lg">
          <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No materials available</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {isTeacherOrDirector
              ? "Upload course materials for your students."
              : "No materials have been uploaded for this course yet."}
          </p>
        </div>
      )}
    </div>
  );
}