import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["teacher", "student", "parent"], {
    required_error: "Please select a role",
  }),
  email: z.string().email().optional().or(z.literal("")),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserCreationFormProps {
  userRole: string;
  onUserCreated?: () => void;
}

export function UserCreationForm({ userRole, onUserCreated }: UserCreationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "student",
      email: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const endpoint = userRole === "director" ? "/api/users/create" : "/api/users/create-student-parent";
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: (newUser) => {
      toast({
        title: "User created successfully",
        description: `${newUser.fullName} has been added as a ${newUser.role}.`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onUserCreated?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  // Determine available roles based on user permission
  const availableRoles = userRole === "director" 
    ? [
        { value: "teacher", label: "Teacher" },
        { value: "student", label: "Student" },
        { value: "parent", label: "Parent" },
      ]
    : [
        { value: "student", label: "Student" },
        { value: "parent", label: "Parent" },
      ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User Account</CardTitle>
        <CardDescription>
          {userRole === "director" 
            ? "Create accounts for teachers, students, and parents in your institution."
            : "Create student and parent accounts for your classes."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter full name"
                      disabled={createUserMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Choose a username"
                      disabled={createUserMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password"
                      placeholder="Create a password (min 8 characters)"
                      disabled={createUserMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={createUserMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      placeholder="Enter email address"
                      disabled={createUserMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating User..." : "Create User Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}