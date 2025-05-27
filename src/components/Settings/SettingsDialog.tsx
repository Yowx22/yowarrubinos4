import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const settingsSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  email: z.string().email({ message: "Please enter a valid email" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.currentPassword,
      });

      if (signInError) throw new Error("Current password is incorrect");

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
        email: data.email,
      });

      if (updateError) throw updateError;

      toast({
        title: "Settings updated",
        description: "Your password and email have been updated successfully.",
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-spdm-dark border-spdm-green/20">
        <DialogHeader>
          <DialogTitle className="text-spdm-green">Settings</DialogTitle>
          <DialogDescription>
            Update your password and email preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-spdm-green">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              className="bg-spdm-gray border-spdm-green/30"
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-red-500 text-sm">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-spdm-green">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              className="bg-spdm-gray border-spdm-green/30"
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword && (
              <p className="text-red-500 text-sm">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-spdm-green">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="bg-spdm-gray border-spdm-green/30"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-spdm-green">Email</Label>
            <Input
              id="email"
              type="email"
              className="bg-spdm-gray border-spdm-green/30"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-spdm-green hover:bg-spdm-darkGreen text-black"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Settings"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}