import React from 'react';
import { 
  Home, Users, Building, CreditCard, MessageSquare, 
  UserCheck, BarChart3, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'warden'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'warden'] },
    { id: 'rooms', label: 'Rooms', icon: Building, roles: ['admin', 'warden'] },
    { id: 'fees', label: 'Fees', icon: CreditCard, roles: ['admin', 'warden', 'student'] },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare, roles: ['admin', 'warden', 'student'] },
    { id: 'visitors', label: 'Visitors', icon: UserCheck, roles: ['admin', 'warden', 'student'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'warden'] },
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">HMS Portal</h1>
        <p className="text-sm text-gray-600 capitalize">{user?.role} Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-3 px-4 py-2 text-gray-600">
          <Settings className="w-5 h-5" />
          <span className="font-medium">{user?.username}</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;