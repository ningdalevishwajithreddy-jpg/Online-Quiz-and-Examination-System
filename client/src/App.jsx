import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';

import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { RedirectIfAuthenticated, RequireAuth } from './components/routing/RouteGuards';
import { Skeleton, SkeletonText } from './components/ui/Feedback';

import Home from './pages/Home';

/**
 * Route table.
 *
 * The landing page is bundled eagerly (it is the first paint for most
 * visitors); every other page and the charting library load on demand, which
 * keeps the initial JavaScript small.
 */
const Features = lazy(() => import('./pages/Features'));
const About = lazy(() => import('./pages/About'));
const Help = lazy(() => import('./pages/Help'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Account = lazy(() => import('./pages/Account'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6" role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-9 w-1/3" />
      <SkeletonText lines={3} />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="features" element={<Features />} />
            <Route path="about" element={<About />} />
            <Route path="help" element={<Help />} />
            <Route path="contact" element={<Contact />} />
            <Route
              path="login"
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="register"
              element={
                <RedirectIfAuthenticated>
                  <Register />
                </RedirectIfAuthenticated>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AppLayout>
                  <Account />
                </AppLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
