import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LanguageToggle from '@/components/LanguageToggle';
import { Leaf, Eye, EyeOff, ArrowRight, Info } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, guestLogin, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Already signed in? Skip straight to the dashboard.
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, location.state, navigate]);

  const handleGuestLogin = () => {
    guestLogin(undefined, formData.email || undefined);
    toast.success('Logged in as Demo Farmer!');
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!isSupabaseConfigured) {
      handleGuestLogin();
      setIsSubmitting(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not log in. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!isSupabaseConfigured) {
      toast.info('Supabase is not configured. Redirecting to Dashboard.');
      handleGuestLogin();
      return;
    }

    if (!formData.email) {
      toast.error('Enter your email above first, then click "Forgot password?"');
      return;
    }
    try {
      await resetPassword(formData.email);
      toast.success(`Password reset email sent to ${formData.email}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
            {t('common.appNameShort')}
          </span>
        </Link>
        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-gray-900">{t('auth.login.title')}</CardTitle>
            <CardDescription className="text-lg">{t('auth.login.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">{t('auth.login.emailLabel') || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg">{t('auth.login.passwordLabel') || 'Password'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-lg h-12 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="w-5 h-5" />
                  <Label htmlFor="remember" className="text-lg font-normal cursor-pointer">Remember me</Label>
                </div>
                <button type="button" onClick={handleForgotPassword} className="text-green-700 hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
              >
                {isSubmitting ? (t('auth.login.submitting') || 'Logging In...') : (t('auth.login.submit') || 'Log In')}
              </Button>
            </form>

            <p className="mt-6 text-center text-lg text-gray-600">
              {t('auth.login.noAccount')}{' '}
              <Link to="/signup" className="text-green-700 font-medium hover:underline">
                {t('auth.login.createOne')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
