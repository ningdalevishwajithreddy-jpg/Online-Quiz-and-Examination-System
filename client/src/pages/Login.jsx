import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { AlertTriangle, KeyRound, LogIn } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IS_DEV_BUILD } from '../utils/appConfig';
import { useSafeReturnUrl } from '../hooks/useSafeReturnUrl';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { loginSchema } from '../utils/validation';
import { fieldErrorsFrom } from '../api/httpClient';

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@quizsphere.test' },
  { role: 'Teacher', email: 'teacher@quizsphere.test' },
  { role: 'Student', email: 'student@quizsphere.test' },
  { role: 'Invigilator', email: 'invigilator@quizsphere.test' },
];

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const returnUrl = useSafeReturnUrl('/dashboard');
  const showDemoAccounts = IS_DEV_BUILD;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`, 'You are signed in.');
      navigate(returnUrl, { replace: true });
    } catch (error) {
      // 401 -> generic credentials message; 429 -> lockout; 422 -> field errors.
      if (error?.status === 422) {
        const fields = fieldErrorsFrom(error);
        Object.entries(fields).forEach(([field, message]) => {
          if (field === 'email' || field === 'password') setError(field, { message });
        });
        return;
      }

      setError('root', {
        message: error?.message || 'Sign in failed. Please try again.',
      });
    }
  };

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sign in to QuizSphere</h1>
          <p className="mt-4 max-w-md text-[var(--color-ink-muted)]">
            Your session is stored in an httpOnly cookie - the token is never exposed to JavaScript. Sessions expire
            automatically and you are returned to the page you were viewing.
          </p>

          {showDemoAccounts ? (
            <Card className="mt-8">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="size-4 text-[var(--color-brand-400)]" aria-hidden="true" />
                Development seed accounts
              </h2>
              <p className="mt-2 text-xs text-[var(--color-ink-dim)]">
                Created by <code>npm run seed</code>. These accounts exist only in your local database and are flagged
                with <code>seedData: true</code>. Password: <code>DemoPass123</code>.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-ink-muted)]">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email} className="flex items-center justify-between gap-3">
                    <span>{account.role}</span>
                    <code className="text-xs">{account.email}</code>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit">
          <h2 className="text-lg font-semibold">Log in</h2>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {errors.root ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3.5 py-3 text-sm text-[var(--color-ink)]"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
                <span>{errors.root.message}</span>
              </div>
            ) : null}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" icon={LogIn} loading={isSubmitting} className="w-full">
              Log in
            </Button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-ink-muted)]">
            No account yet?{' '}
            <Link to="/register" className="font-medium text-[var(--color-accent-300)] hover:underline">
              Create a student account
            </Link>
          </p>

          <p className="mt-4 text-xs text-[var(--color-ink-dim)]">
            Sign-in attempts are rate limited and repeated failures temporarily lock the account.
          </p>

          {showDemoAccounts ? (
            <Badge tone="warning" className="mt-4">
              Development build - demo credentials visible
            </Badge>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
