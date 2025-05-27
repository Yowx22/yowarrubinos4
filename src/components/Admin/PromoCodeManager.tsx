import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Check, X, Calendar } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  amount: number;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
}

const promoCodeSchema = z.object({
  code: z.string().min(3, { message: "Code must be at least 3 characters" }),
  amount: z.number().int().min(1, { message: "Amount must be at least 1" }),
  max_uses: z.number().int().nullable(),
  expires_at: z.string().nullable(),
  is_active: z.boolean()
});

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

const PromoCodeManager = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      amount: 100,
      max_uses: 10,
      expires_at: null,
      is_active: true
    },
  });
  
  // Fetch promo codes
  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('promocodes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setPromoCodes(data as PromoCode[]);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch promo codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPromoCodes();
  }, []);
  
  const handleSubmit = async (data: PromoCodeFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('promocodes').insert({
        code: data.code.toUpperCase(),
        amount: data.amount,
        created_by: user.id,
        expires_at: data.expires_at,
        is_active: data.is_active,
        max_uses: data.max_uses
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Promo code created successfully",
      });
      
      // Reset the form and fetch updated list
      form.reset();
      setIsAdding(false);
      fetchPromoCodes();
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const togglePromoCodeStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promocodes')
        .update({ is_active: !isActive })
        .eq('id', id);
        
      if (error) throw error;
      
      fetchPromoCodes();
      
      toast({
        title: "Success",
        description: `Promo code ${isActive ? 'deactivated' : 'activated'}`,
      });
    } catch (error: any) {
      console.error("Error updating promo code status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code status",
        variant: "destructive",
      });
    }
  };
  
  const deletePromoCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      const { error } = await supabase
        .from('promocodes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      fetchPromoCodes();
      
      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };
  
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    form.setValue('code', code);
  };
  
  return (
    <div className="p-5 rounded-lg bg-spdm-dark border border-spdm-green/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-spdm-green">Promo Code Manager</h2>
        
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
          >
            <Plus className="mr-1 h-4 w-4" /> Create Code
          </Button>
        )}
      </div>
      
      {isAdding && (
        <div className="bg-spdm-gray p-4 rounded-lg mb-6 border border-spdm-green/20">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="code" className="text-spdm-green">Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="code"
                    placeholder="Enter code or generate"
                    className="bg-spdm-dark border-spdm-green/30"
                    {...form.register("code")}
                  />
                  <Button
                    type="button"
                    onClick={generateRandomCode}
                    className="bg-spdm-gray hover:bg-spdm-green/20 text-spdm-green"
                  >
                    Generate
                  </Button>
                </div>
                {form.formState.errors.code && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.code.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="amount" className="text-spdm-green">Coins Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  className="bg-spdm-dark border-spdm-green/30 mt-1"
                  {...form.register("amount", { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="max_uses" className="text-spdm-green">Max Uses (optional)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  className="bg-spdm-dark border-spdm-green/30 mt-1"
                  {...form.register("max_uses", { valueAsNumber: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="expires_at" className="text-spdm-green">Expiration Date (optional)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  className="bg-spdm-dark border-spdm-green/30 mt-1"
                  {...form.register("expires_at")}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.watch("is_active")}
                onCheckedChange={(value) => form.setValue("is_active", value)}
              />
              <Label htmlFor="is_active" className="text-white">Code is active</Label>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                onClick={() => setIsAdding(false)}
                variant="outline"
                className="border-spdm-green/30 text-spdm-green hover:bg-spdm-green/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Code"}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-6 text-gray-400">Loading promo codes...</div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-6 text-gray-400">No promo codes found</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-400 border-b border-spdm-green/20">
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Uses</th>
                <th className="px-4 py-2">Expires</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((code) => (
                <tr key={code.id} className="border-b border-spdm-green/10 hover:bg-spdm-green/5">
                  <td className="px-4 py-3 font-mono font-medium text-white">{code.code}</td>
                  <td className="px-4 py-3 text-spdm-green font-semibold">{code.amount}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {code.current_uses}
                    {code.max_uses && <span className="text-gray-500">/{code.max_uses}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {code.expires_at ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-spdm-green" />
                        {new Date(code.expires_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          code.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className={code.is_active ? "text-green-500" : "text-red-500"}>
                        {code.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => togglePromoCodeStatus(code.id, code.is_active)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-spdm-green/30"
                      >
                        {code.is_active ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        onClick={() => deletePromoCode(code.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PromoCodeManager;