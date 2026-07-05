import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui';

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const status = isRouteErrorResponse(error) ? error.status : 'Unknown';
  const statusText = isRouteErrorResponse(error) ? error.statusText : 'Error';
  const message = isRouteErrorResponse(error) 
    ? error.data?.message || error.statusText 
    : error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          {isNotFound ? '404' : status}
        </h1>

        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {isNotFound ? 'Page not found' : statusText}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
          {isNotFound 
            ? 'The page you are looking for does not exist.' 
            : message}
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
