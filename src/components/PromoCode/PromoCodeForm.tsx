
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCoins } from '@/hooks/useCoins';

const promoCodeSchema = z.object({
  code: z.string().min(3, { message: "Promo code must be at least 3 characters" })
});

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

const PromoCodeForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addCoins } = useCoins();
  
  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
    },
  });
  
  const handleSubmit = async (data: PromoCodeFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to redeem codes",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the redeem_promocode RPC function
      const { data: result, error } = await supabase.rpc('redeem_promocode', {
        code_text: data.code.trim()
      });
      
      if (error) throw error;
      
      if (result.success) {
        // Success
        toast({
          title: "Success!",
          description: result.message,
          variant: "default",
        });
        
        // Reset the form
        form.reset();
        
        // Refresh the user's balance
        await addCoins(0, "refresh");
      } else {
        // Error from the function
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error redeeming promo code:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to redeem promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-spdm-gray rounded-lg p-5 border border-spdm-green/20">
      <h3 className="text-xl font-semibold text-spdm-green mb-4">Redeem a Promo Code</h3>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Input
              placeholder="Enter promo code"
              className="bg-spdm-dark border-spdm-green/30 focus:border-spdm-green pr-24"
              {...form.register("code")}
            />
            <Button 
              type="submit" 
              className="absolute right-1 top-1 bg-spdm-green hover:bg-spdm-darkGreen text-black h-8 px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redeeming..." : "Redeem"}
            </Button>
          </div>
          {form.formState.errors.code && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.code.message}
            </p>
          )}
        </div>
      </form>
      
      <p className="text-xs text-gray-400 mt-3">
        Enter a valid promo code to receive coins. Each code can only be used once per account.
      </p>
    </div>
  );
};

export default PromoCodeForm;
