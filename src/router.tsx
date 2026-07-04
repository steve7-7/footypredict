import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CardSkeleton } from './components/ui';

const DashboardHome = lazy(() => import('./pages/DashboardHome').then(m => ({ default: m.DashboardHome })));
const PredictionsList = lazy(() => import('./pages/PredictionsList').then(m => ({ default: m.PredictionsList })));
const PremiumUpgrade = lazy(() => import('./pages/PremiumUpgrade').then(m => ({ default: m.PremiumUpgrade })));
const SlideResults = lazy(() => import('./pages/SlideResults').then(m => ({ default: m.SlideResults })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const PastPredictions = lazy(() => import('./pages/PastPredictions').then(m => ({ default: m.PastPredictions })));

const PageLoader = () => (
  <div className="space-y-4">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardHome />
          </Suspense>
        ),
      },
      {
        path: 'predictions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PredictionsList />
          </Suspense>
        ),
      },
      {
        path: 'results',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SlideResults />
          </Suspense>
        ),
      },
      {
        path: 'premium',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PremiumUpgrade />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserProfile />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPage />
          </Suspense>
        ),
      },
      {
        path: 'past-predictions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PastPredictions />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
