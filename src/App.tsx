import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

const Home = lazy(() => import('./routes/Home'));
const Dictionary = lazy(() => import('./routes/Dictionary'));
const SignDetail = lazy(() => import('./routes/SignDetail'));
const Learn = lazy(() => import('./routes/Learn'));
const Review = lazy(() => import('./routes/Review'));
const Fingerspelling = lazy(() => import('./routes/Fingerspelling'));
const Numbers = lazy(() => import('./routes/Numbers'));
const Grammar = lazy(() => import('./routes/Grammar'));
const Info = lazy(() => import('./routes/Info'));
const Profile = lazy(() => import('./routes/Profile'));
const Settings = lazy(() => import('./routes/Settings'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-ink-800 dark:border-ink-700 dark:border-t-brass-500 animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/dictionary/:id" element={<SignDetail />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/review" element={<Review />} />
          <Route path="/fingerspelling" element={<Fingerspelling />} />
          <Route path="/numbers" element={<Numbers />} />
          <Route path="/grammar" element={<Grammar />} />
          <Route path="/info" element={<Info />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

function NotFound() {
  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <p className="font-serif text-6xl text-ink-300 dark:text-ink-300 tabular-nums">404</p>
      <p className="text-ink-500 dark:text-ink-200 mt-2">Хуудас олдсонгүй.</p>
    </div>
  );
}
