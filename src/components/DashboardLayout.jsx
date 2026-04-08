import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function DashboardLayout({ children }) {
  return (
    <div className="bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 antialiased min-h-screen transition-colors duration-300 relative overflow-x-hidden">
      {/* Background Polish */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/20 rounded-full blur-[150px]"></div>
      </div>

      <TopNav />
      <div className="flex min-h-screen pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
