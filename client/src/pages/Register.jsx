import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { emailField, nameField, passwordField } from '../utils/validation';
import { fieldErrorsFrom } from '../api/httpClient';

/** Client mirror of the register contract (the server re-validates everything). */
const formSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function Register() {
  useDocumentTitle('Create account');
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ name, email, password }) => {
    try {
      const user = await registerUser({ name, email, password });
      toast.success(`Welcome, ${user.name.split(' ')[0]}`, 'Your student account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error?.status === 422) {
        const fields = fieldErrorsFrom(error);
        Object.entries(fields).forEach(([field, message]) => {
          if (['name', 'email', 'password'].includes(field)) setError(field, { message });
        });
        return;
      }

      if (error?.status === 409) {
        setError('email', { message: 'An account with this email already exists' });
        return;
      }

      setError('root', { message: error?.message || 'Could not create your account. Please try again.' });
    }
  };

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">Get started</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create your student account</h1>
          <p className="mt-4 max-w-md text-[var(--color-ink-muted)]">
            Public registration creates student accounts only. Teacher, invigilator and administrator roles are
            assigned by an administrator, so the API refuses any role supplied by a client.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-[var(--color-ink-muted)]">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              Passwords are hashed with bcrypt at cost 12 and never stored or logged in plain text.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              Minimum eight characters with at least one letter and one number.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              Sign-in is rate limited, and repeated failures temporarily lock the account.
            </li>
          </ul>
        </div>

        <Card className="h-fit">
          <h2 className="text-lg font-semibold">Register</h2>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {errors.root ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3.5 py-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
                <span>{errors.root.message}</span>
              </div>
            ) : null}

            <Input
              label="Full name"
              autoComplete="name"
              required
              error={errors.name?.message}
              {...register('name')}
            />

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
              autoComplete="new-password"
              required
              hint="At least 8 characters, including a letter and a number."
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" icon={Sparkles} loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-ink-muted)]">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-[var(--color-accent-300)] hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}
