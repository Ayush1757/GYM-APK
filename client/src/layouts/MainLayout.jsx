import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  User, 
  Dumbbell, 
  QrCode, 
  Receipt, 
  BarChart3, 
  Trophy, 
  Calculator, 
  LogOut, 
  Menu, 
  X,
  Bell,
  ChevronRight
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={22} strokeWidth={2.5} />
    {!collapsed && <span className="font-semibold">{label}</span>}
    {active && !collapsed && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Dumbbell, label: 'Workout', path: '/workouts' },
    { icon: QrCode, label: 'Scan Gym QR', path: '/scan' },
    { icon: Receipt, label: 'Fees & Payments', path: '/payments' },
    { icon: BarChart3, label: 'Progress', path: '/progress' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Trophy, label: 'Achievements', path: '/achievements' },
    { icon: Calculator, label: 'BMI Calculator', path: '/bmi' },
  ];

  const handleNav = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-gray-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && <h2 className="text-xl font-black text-neon-green tracking-tighter">TFC 💪🏻</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              {...item}
              active={location.pathname === item.path}
              collapsed={isCollapsed}
              onClick={() => handleNav(item.path)}
            />
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <SidebarItem 
            icon={LogOut} 
            label="Logout" 
            onClick={() => { /* handle logout */ }} 
            collapsed={isCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-72 bg-[#0a0a0a] z-[70] lg:hidden flex flex-col border-r border-white/5 shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-bottom border-white/5">
                <h2 className="text-xl font-black text-neon-green tracking-tighter">TFC 💪🏻</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-2 py-6">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    {...item}
                    active={location.pathname === item.path}
                    onClick={() => handleNav(item.path)}
                  />
                ))}
              </nav>
              <div className="p-4">
                <SidebarItem icon={LogOut} label="Logout" onClick={() => {}} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        {/* Top Navbar */}
        <header className="h-16 lg:h-20 bg-dark-bg/80 backdrop-blur-md sticky top-0 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg lg:text-xl font-bold hidden sm:block capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button className="p-2 text-gray-400 hover:text-white relative bg-white/5 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-neon-green rounded-full shadow-[0_0_8px_#ccff00]"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-white/10 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">Ayush</p>
                <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest mt-1">Pro Member</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-tr from-neon-green to-[#80ff00] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                  <User size={24} className="text-neon-green" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Optional but requested) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-[50]">
        <button onClick={() => navigate('/dashboard')} className={`p-2 transition-colors ${location.pathname === '/dashboard' ? 'text-neon-green' : 'text-gray-500'}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => navigate('/workouts')} className={`p-2 transition-colors ${location.pathname === '/workouts' ? 'text-neon-green' : 'text-gray-500'}`}>
          <Dumbbell size={24} />
        </button>
        <div className="relative -top-6">
          <button 
            onClick={() => navigate('/scan')}
            className="w-14 h-14 bg-neon-green text-black rounded-full shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center border-4 border-dark-bg"
          >
            <QrCode size={28} />
          </button>
        </div>
        <button onClick={() => navigate('/payments')} className={`p-2 transition-colors ${location.pathname === '/payments' ? 'text-neon-green' : 'text-gray-500'}`}>
          <Receipt size={24} />
        </button>
        <button onClick={() => navigate('/profile')} className={`p-2 transition-colors ${location.pathname === '/profile' ? 'text-neon-green' : 'text-gray-500'}`}>
          <User size={24} />
        </button>
      </nav>
    </div>
  );
};

export default MainLayout;
