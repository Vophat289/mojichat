import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { LogOut } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, signOut } = useAuthStore();

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Cột nhỏ bên trái cùng chứa avatar và nút logout */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 justify-between shrink-0 z-20">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-white transition-all"
            title={user?.displayName}
          >
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <button 
          onClick={signOut}
          className="w-10 h-10 rounded-xl hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex min-w-0 h-full">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
