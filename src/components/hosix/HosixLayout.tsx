import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import HosixSidebar from './HosixSidebar';
import HosixHeader from './HosixHeader';
import TabBar from '../../shared/components/layout/TabBar';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';

const HosixLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setIsMobile } = useUIStore();
  const { notifications, removeNotification } = useNotificationStore();

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobile(isMobile);
      if (isMobile) setSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <HosixSidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <HosixHeader 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* TabBar (Workspaces) */}
        <TabBar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notifications Toast Container */}
      <div className="fixed top-4 right-4 space-y-2 z-50 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg text-white ${
              notification.type === 'success'
                ? 'bg-green-500'
                : notification.type === 'error'
                ? 'bg-red-500'
                : notification.type === 'warning'
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {notification.title && (
                  <p className="font-semibold">{notification.title}</p>
                )}
                <p className="text-sm">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { HosixLayout };
export default HosixLayout;
