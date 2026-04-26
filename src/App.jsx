import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AddStory from './pages/AddStory';
import StoryView from './pages/StoryView';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();

  // Prefetch currentUser assim que a auth carrega
  useEffect(() => {
    if (!isLoadingAuth && !authError) {
      queryClient.prefetchQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [isLoadingAuth, authError]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/AddStory" element={<AddStory />} />
      <Route path="/StoryView" element={<StoryView />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <TabHistoryProvider>
            <div style={{ 
                maxWidth: '430px', 
                margin: '0 auto', 
                position: 'relative',
                height: '100dvh',
                overflow: 'hidden'
              }}>
              <AuthenticatedApp />
            </div>
            </TabHistoryProvider>
            
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App