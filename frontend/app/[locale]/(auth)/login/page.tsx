'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2, BookOpen, Shield, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { ApiError } from '@/types/api.types';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function LoginPageClient() {
  const t = useTranslations('auth');
  const tNav = useTranslations('language');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? ROUTES.DASHBOARD.ROOT;
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login({ identifier: data.identifier, password: data.password });
      toast.success('Welcome back! Redirecting to dashboard…');
      router.push(callbackUrl);
    } catch (error) {
      const apiError = error as ApiError;
      const message =
        apiError.status === 400 ? t('invalidCredentials') :
        apiError.status === 0 ? 'Unable to connect to server. Please try again.' :
        apiError.message ?? 'An error occurred. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* LEFT PANEL — Branding */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center bg-brand-gradient overflow-hidden"
      >
        <div className="absolute inset-0 islamic-pattern-bg opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.64_0.145_163/0.3)_0%,transparent_70%)]" />
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-yellow-400/10 blur-3xl" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center text-center px-12 max-w-md"
        >
          <motion.div variants={fadeUp} className="mb-8">
            <div className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-3 shadow-2xl">
              <Image src="/yahaya-logo.jpeg" alt="Yahaya International Islamic and English High School Logo" width={90} height={90} className="rounded-xl object-contain" priority />
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-3xl font-bold text-white leading-tight mb-3">
            Yahaya International Islamic<br />
            <span className="text-brand-gold">and English High School</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-white/70 text-base leading-relaxed mb-10">
            Empowering minds through Islamic values and modern education.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col gap-3 w-full">
            {[
              { icon: Shield, text: 'Secure & Role-Based Access Control' },
              { icon: BookOpen, text: 'Complete School Management Suite' },
              { icon: Globe, text: 'Multilingual: English · العربية · Français · Türkçe' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-gold" />
                </div>
                <span className="text-white/85 text-sm text-start">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2 mb-4">
              <Image src="/yahaya-logo.jpeg" alt="YAHAYASCOOL Logo" width={60} height={60} className="rounded-xl object-contain" priority />
            </div>
            <h1 className="text-xl font-bold text-foreground text-center">
              Yahaya International Islamic<br />and English High School
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">{t('signInTitle')}</h2>
            <p className="text-muted-foreground">{t('signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-sm font-medium text-foreground">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="identifier" type="email" autoComplete="email"
                  placeholder="admin@yahayascool.edu.ng" disabled={isLoading}
                  {...register('identifier')}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-foreground text-sm',
                    'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                    'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
                    errors.identifier ? 'border-destructive focus:ring-destructive/30' : 'border-input hover:border-primary/40'
                  )}
                />
              </div>
              <AnimatePresence mode="wait">
                {errors.identifier && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs text-destructive mt-1">
                    {errors.identifier.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="••••••••" disabled={isLoading}
                  {...register('password')}
                  className={cn(
                    'w-full pl-10 pr-12 py-3 rounded-xl border bg-background text-foreground text-sm',
                    'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                    'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
                    errors.password ? 'border-destructive focus:ring-destructive/30' : 'border-input hover:border-primary/40'
                  )}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" {...register('rememberMe')} className="w-4 h-4 rounded border-input text-primary focus:ring-ring" />
                <span className="text-sm text-muted-foreground">{t('rememberMe')}</span>
              </label>
              <Link href={ROUTES.AUTH.FORGOT_PASSWORD} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" disabled={isLoading} id="login-submit-btn" className={cn('w-full py-3 h-auto text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg', isLoading && 'opacity-80 cursor-not-allowed')}>
              {isLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in…</span>
              ) : t('login')}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">YAHAYASCOOL v1.0</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {(['en', 'ar', 'fr', 'tr'] as const).map((loc) => (
              <Link key={loc} href={loc === 'en' ? '/login' : `/${loc}/login`} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-border hover:border-primary/40 hover:text-primary text-muted-foreground')}>
                {tNav(loc)}
              </Link>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Yahaya International Islamic and English High School. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
