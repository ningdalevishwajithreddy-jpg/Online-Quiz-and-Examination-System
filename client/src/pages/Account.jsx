import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, BadgeCheck, KeyRound, Lock, Mail, ShieldCheck, UserCog } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';
import SignOutButton from '../components/auth/SignOutButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { changePasswordSchema, profileSchema } from '../utils/validation';
import { fieldErrorsFrom } from '../api/httpClient';
import authApi from '../api/authApi';
import { formatDateTime } from '../utils/format';
import { capabilitiesFor } from '../utils/permissions';

function ProfileCard() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const onSubmit = async (values) => {
    try {
      const updated = await updateProfile(values);
      reset({ name: updated.name });
      toast.success('Profile updated', 'Your display name has been saved.');
    } catch (error) {
      const fields = fieldErrorsFrom(error);
      if (fields.name) setError('name', { message: fields.name });
      else toast.error('Update failed', error?.message || 'Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader
        icon={UserCog}
        title="Profile"
        description="Your display name appears on attempts, results and reports."
      />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Full name"
          autoComplete="name"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-ink-muted)]">
            <Mail className="size-3.5" aria-hidden="true" /> Email
          </span>
          <p className="rounded-xl border border-dashed border-[var(--color-line)] px-3.5 py-2.5 text-sm text-[var(--color-ink-muted)]">
            {user?.email}
          </p>
          <p className="text-xs text-[var(--color-ink-dim)]">
            Email changes need re-verification and are issued by an administrator in this phase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
          <Button type="button" variant="ghost" onClick={() => reset({ name: user?.name || '' })} disabled={!isDirty}>
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    try {
      const result = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed', result?.message || 'Other devices have been signed out.');
    } catch (error) {
      const fields = fieldErrorsFrom(error);
      if (fields.newPassword) setError('newPassword', { message: fields.newPassword });
      if (fields.currentPassword) setError('currentPassword', { message: fields.currentPassword });
      if (error?.status === 401) setError('currentPassword', { message: error.message });
      if (!fields.newPassword && !fields.currentPassword && error?.status !== 401) {
        toast.error('Password change failed', error?.message || 'Please try again.');
      }
    }
  };

  return (
    <Card>
      <CardHeader
        icon={KeyRound}
        title="Password"
        description="Changing your password invalidates every previously issued session token."
      />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters with a letter and a number."
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting} icon={Lock}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

function SessionCard() {
  const { user, roleLabel } = useAuth();

  return (
    <Card>
      <CardHeader icon={ShieldCheck} title="Account & session" description="What the server knows about this session." />
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-ink-muted)]">Role</dt>
          <dd>
            <Badge tone="brand">{roleLabel || user?.role}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-ink-muted)]">Account status</dt>
          <dd>
            <Badge tone={user?.status === 'active' ? 'success' : 'warning'} icon={BadgeCheck}>
              {user?.status}
            </Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-ink-muted)]">Last sign-in</dt>
          <dd className="text-[var(--color-ink)]">{formatDateTime(user?.lastLoginAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-ink-muted)]">Registered</dt>
          <dd className="text-[var(--color-ink)]">{formatDateTime(user?.createdAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-ink-muted)]">Session storage</dt>
          <dd className="text-right text-[var(--color-ink)]">
            httpOnly cookie
            <span className="block text-xs text-[var(--color-ink-dim)]">not readable by JavaScript</span>
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <SignOutButton variant="secondary" showLabel />
      </div>
    </Card>
  );
}

function CapabilitiesCard() {
  const { user, roleLabel } = useAuth();
  const capabilities = capabilitiesFor(user?.role);

  return (
    <Card>
      <CardHeader
        icon={BadgeCheck}
        title={`${roleLabel || 'Your'} capabilities`}
        description="Informational summary - the server enforces every permission on each request."
      />
      <ul className="space-y-2 text-sm text-[var(--color-ink-muted)]">
        {capabilities.map((capability) => (
          <li key={capability} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-accent-400)]" aria-hidden="true" />
            {capability}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Account() {
  useDocumentTitle('My account');
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">My account</h1>
          <p className="mt-2 text-[var(--color-ink-muted)]">
            Manage your display name, password and review what this session can do.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileCard />
          <PasswordCard />
          <SessionCard />
          <CapabilitiesCard />
        </div>

        <Card className="border-[color-mix(in_srgb,var(--color-warning)_28%,transparent)]">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="size-4.5 text-[var(--color-warning)]" aria-hidden="true" />
            Deleting your account
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Account deletion is not available in this phase, deliberately: attempts and results must be retained for
            audit. An administrator suspends accounts instead, which immediately invalidates active sessions.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setConfirmOpen(true)}>
            Why can't I delete my account?
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone="primary"
        title="Account deletion is not enabled"
        description="Exam records are audit-relevant and are retained. Ask an administrator to suspend the account if you need to stop using it."
        confirmLabel="Understood"
        cancelLabel="Close"
        onConfirm={() => {
          setConfirmOpen(false);
          toast.info('No changes were made', 'Account deletion stays disabled in this phase.');
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      {user?.seedData ? (
        <p className="mx-auto mt-6 w-full max-w-6xl text-xs text-[var(--color-ink-dim)]">
          This account is development seed data (<code>seedData: true</code>).
        </p>
      ) : null}
    </>
  );
}
