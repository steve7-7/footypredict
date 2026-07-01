import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardHome } from './pages/DashboardHome';
import { PredictionsList } from './pages/PredictionsList';
import { PremiumUpgrade } from './pages/PremiumUpgrade';
import { SlideResults } from './pages/SlideResults';
import { UserProfile } from './pages/UserProfile';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: 'predictions',
        element: <PredictionsList />,
      },
      {
        path: 'results',
        element: <SlideResults />,
      },
      {
        path: 'premium',
        element: <PremiumUpgrade />,
      },
      {
        path: 'profile',
        element: <UserProfile />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'privacy',
        element: <PrivacyPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
