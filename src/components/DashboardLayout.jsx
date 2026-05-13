import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { useData } from '../context/DataContext';

export default function DashboardLayout({ children }) {
  const { user } = useData();
  return (
    <div className="bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 antialiased min-h-screen transition-colors duration-300 relative overflow-x-hidden">
      {/* Ambient background blurs */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/20 rounded-full blur-[150px]"></div>
      </div>

      <TopNav />
      <div className="flex min-h-screen pt-16">
        <Sidebar />
        {/* Main content area with proper bottom padding for mobile bottom nav */}
        <main className="flex-1 md:ml-64 p-4 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8 transition-all duration-300 min-w-0 animate-slide-up">
          {children}
        </main>
      </div>
      {user && <BottomNav role={user.role} />}
    </div>
  );
}
