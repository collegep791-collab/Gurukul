/**
 * App.jsx
 * 
 * Technical Component: Main Frontend Router
 * Description: This file is the root component of the Gurukul application.
 * It manages all client-side routing using React Router, protecting restricted 
 * routes with the <AuthGuard> component (which checks for a valid session/JWT).
 * It dynamically routes users to their respective dashboards (Admin, Student, Teacher)
 * and provides fallbacks like the 404 <NotFound> page.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ResourceHub from './pages/ResourceHub';
import Chat from './pages/Chat';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import Assignments from './pages/Assignments';
import AuditLogs from './pages/AuditLogs';
import NotFound from './pages/NotFound';

function AuthGuard({ children }) {
  const { user, authLoading } = useData();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">Loading Gurukul...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/dashboard" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
      <Route path="/student/dashboard" element={<AuthGuard><StudentDashboard /></AuthGuard>} />
      <Route path="/teacher/dashboard" element={<AuthGuard><TeacherDashboard /></AuthGuard>} />
      <Route path="/resources" element={<AuthGuard><ResourceHub /></AuthGuard>} />
      <Route path="/chat" element={<AuthGuard><Chat /></AuthGuard>} />
      <Route path="/users" element={<AuthGuard><Users /></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
      <Route path="/notes" element={<AuthGuard><Notes /></AuthGuard>} />
      <Route path="/assignments" element={<AuthGuard><Assignments /></AuthGuard>} />
      <Route path="/audit" element={<AuthGuard><AuditLogs /></AuthGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <DataProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
