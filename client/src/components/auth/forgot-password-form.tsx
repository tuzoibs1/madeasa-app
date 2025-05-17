import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Check } from "lucide-react";

// Define the schema for password reset request
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Define the schema for password reset completion
const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ForgotPasswordFormProps = {
  onCancel: () => void;
};

export function ForgotPasswordForm({ onCancel }: ForgotPasswordFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"request" | "resetCode" | "complete">("request");
  const [email, setEmail] = useState("");

  // Form for requesting password reset
  const requestForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for resetting password with token
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetToken: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutation for requesting password reset
  const requestResetMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset email sent",
        description: "Check your email for the password reset code",
      });
      setStep("resetCode");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  // Mutation for completing password reset
  const completeResetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        email,
        token: data.resetToken,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      setStep("complete");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onRequestSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    setEmail(values.email);
    requestResetMutation.mutate({ email: values.email });
  };

  const onResetSubmit = (values: z.infer<typeof resetPasswordSchema>) => {
    completeResetMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {step === "request" && (
        <>
          <div className="text-center mb-6">
            <Mail className="h-10 w-10 text-primary mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Forgot Password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your email address and we'll send you a code to reset your password
            </p>
          </div>

          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
              <FormField
                control={requestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email address" 
                        {...field} 
                        disabled={requestResetMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-2 mt-6">
                <Button
                  type="submit"
                  disabled={requestResetMutation.isPending}
                  className="w-full"
                >
                  {requestResetMutation.isPending ? "Sending..." : "Send Reset Code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="w-full"
                  disabled={requestResetMutation.isPending}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}

      {step === "resetCode" && (
        <>
          <div className="text-center mb-6">
            <Mail className="h-10 w-10 text-primary mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Reset Your Password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter the reset code sent to {email} and your new password
            </p>
          </div>

          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="resetToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the reset code from your email" 
                        {...field} 
                        disabled={completeResetMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Create a new password" 
                        {...field} 
                        disabled={completeResetMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Confirm your new password" 
                        {...field} 
                        disabled={completeResetMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-2 mt-6">
                <Button
                  type="submit"
                  disabled={completeResetMutation.isPending}
                  className="w-full"
                >
                  {completeResetMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("request")}
                  className="w-full"
                  disabled={completeResetMutation.isPending}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}

      {step === "complete" && (
        <div className="text-center space-y-4">
          <div className="bg-success/20 rounded-full p-4 w-20 h-20 mx-auto">
            <Check className="h-12 w-12 text-success" />
          </div>
          <h2 className="text-2xl font-bold">Password Reset Complete</h2>
          <p className="text-slate-500">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Button onClick={onCancel} className="w-full mt-4">
            Return to Login
          </Button>
        </div>
      )}
    </div>
  );
}