import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase, logToDiscord } from '@/integrations/supabase/client';

const BugReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a bug report",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert into bug_reports table
      const { error: dbError } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user.id,
          message: message.trim()
        });

      if (dbError) throw dbError;

      // Send to Discord webhook
      await logToDiscord(`Bug Report from ${user.username}:\n${message}`, 'warning');

      toast({
        title: "Success",
        description: "Your bug report has been submitted",
      });

      setMessage('');
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Error",
        description: "Failed to submit bug report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-spdm-gray rounded-lg text-center">
        <h2 className="text-xl font-semibold text-spdm-green mb-3">Bug Report</h2>
        <p className="text-gray-400">Please login to submit a bug report.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-spdm-gray rounded-lg p-6 border border-spdm-green/20">
        <h2 className="text-xl font-semibold text-spdm-green mb-4">Submit Bug Report</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the bug in detail..."
              className="bg-spdm-dark border-spdm-green/30 min-h-[150px]"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full bg-spdm-green hover:bg-spdm-darkGreen text-black"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-spdm-dark rounded-lg border border-spdm-green/20">
          <h3 className="text-lg font-medium text-spdm-green mb-2">Guidelines</h3>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Be specific about what isn't working</li>
            <li>Include steps to reproduce the issue</li>
            <li>Mention any error messages you see</li>
            <li>Include your device and browser information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BugReport;