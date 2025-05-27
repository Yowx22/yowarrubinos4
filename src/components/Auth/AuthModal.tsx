
import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = loginSchema.extend({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'signup';
}

const AuthModal = ({ isOpen, onClose, type }: AuthModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>(type);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Login successful!",
        description: "Welcome back to SPDM!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      await signup(data.email, data.username, data.password);
      toast({
        title: "Account created!",
        description: "Welcome to SPDM!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthType = () => {
    setAuthType(authType === 'login' ? 'signup' : 'login');
  };

  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 30 
      } 
    },
    exit: { 
      opacity: 0, 
      y: 50, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.3 
      }
    })
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        key="modal-container"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm" 
          onClick={onClose}
          variants={backdropVariants}
        />
        
        <motion.div 
          className="bg-spdm-dark border border-spdm-green/50 rounded-lg p-6 w-[95%] max-w-md z-10 relative"
          variants={modalVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <motion.h2 
              className="text-xl font-semibold text-spdm-green"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {authType === 'login' ? 'Login' : 'Create Account'}
            </motion.h2>
            <motion.button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-spdm-gray text-spdm-green transition-colors"
              whileTap={{ scale: 0.9, rotate: -90 }}
              whileHover={{ rotate: -15 }}
            >
              <X size={18} />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {authType === 'login' ? (
              <motion.form 
                key="login-form"
                onSubmit={loginForm.handleSubmit(handleLogin)} 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <motion.div className="space-y-2" variants={inputVariants} custom={0}>
                  <Label htmlFor="email" className="text-spdm-green">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-spdm-gray text-white border-spdm-green/30 focus:border-spdm-green"
                    placeholder="you@example.com"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>
                  )}
                </motion.div>
                <motion.div className="space-y-2" variants={inputVariants} custom={1}>
                  <Label htmlFor="password" className="text-spdm-green">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-spdm-gray text-white border-spdm-green/30 focus:border-spdm-green"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>
                  )}
                </motion.div>
                <motion.div variants={inputVariants} custom={2}>
                  <Button 
                    type="submit"
                    className="w-full bg-spdm-green hover:bg-spdm-darkGreen text-black font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                </motion.div>
                <motion.p 
                  className="text-center text-sm text-gray-400 mt-4"
                  variants={inputVariants} 
                  custom={3}
                >
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleAuthType}
                    className="text-spdm-green hover:underline"
                  >
                    Sign up
                  </button>
                </motion.p>
              </motion.form>
            ) : (
              <motion.form 
                key="signup-form"
                onSubmit={signupForm.handleSubmit(handleSignup)} 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <motion.div className="space-y-2" variants={inputVariants} custom={0}>
                  <Label htmlFor="username" className="text-spdm-green">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    className="bg-spdm-gray text-white border-spdm-green/30 focus:border-spdm-green"
                    placeholder="Your username"
                    {...signupForm.register("username")}
                  />
                  {signupForm.formState.errors.username && (
                    <p className="text-red-500 text-sm">{signupForm.formState.errors.username.message}</p>
                  )}
                </motion.div>
                <motion.div className="space-y-2" variants={inputVariants} custom={1}>
                  <Label htmlFor="email" className="text-spdm-green">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-spdm-gray text-white border-spdm-green/30 focus:border-spdm-green"
                    placeholder="you@example.com"
                    {...signupForm.register("email")}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-red-500 text-sm">{signupForm.formState.errors.email.message}</p>
                  )}
                </motion.div>
                <motion.div className="space-y-2" variants={inputVariants} custom={2}>
                  <Label htmlFor="password" className="text-spdm-green">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-spdm-gray text-white border-spdm-green/30 focus:border-spdm-green"
                    placeholder="••••••••"
                    {...signupForm.register("password")}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-red-500 text-sm">{signupForm.formState.errors.password.message}</p>
                  )}
                </motion.div>
                <motion.div className="space-y-2" variants={inputVariants} custom={3}>
                  <Label htmlFor="confirmPassword" className="text-spdm-green">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-spdm-gray text-white border-spdm-green/30 focus:border-spdm-green"
                    placeholder="••••••••"
                    {...signupForm.register("confirmPassword")}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </motion.div>
                <motion.div variants={inputVariants} custom={4}>
                  <Button 
                    type="submit"
                    className="w-full bg-spdm-green hover:bg-spdm-darkGreen text-black font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating account..." : "Sign Up"}
                  </Button>
                </motion.div>
                <motion.p 
                  className="text-center text-sm text-gray-400 mt-4"
                  variants={inputVariants}
                  custom={5}
                >
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleAuthType}
                    className="text-spdm-green hover:underline"
                  >
                    Log in
                  </button>
                </motion.p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
