import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { DecisionPopup } from '../components/decision popup.tsx';
import { type RootState } from '../store';
import { LayoutDashboard, Power, FileText, FolderOpen, CalendarRange, UserCog2, BarChart3, Settings, Building, Building2, School, BookCopy, Shield, Menu, X as CloseIcon, Sun, Moon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

// Logos
import Logo from '../assets/logos/medium-logo.svg';

import { logout, reset } from '../features/login/loginSlice.ts';
import { addToast } from '../features/toasts/toastSlice.ts';

// Sidebar Item
const SidebarItem = ({ name, path, icon: Icon, collapsed, isFirst, isLast }: { name: string, path: string, icon: any, collapsed: boolean, isFirst?: boolean, isLast?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  const roundedClass = collapsed
    ? 'rounded-[24px]'
    : isFirst
      ? 'rounded-t-[24px] rounded-b-[12px]'
      : isLast
        ? 'rounded-b-[24px] rounded-t-[12px]'
        : 'rounded-[12px]';

  return (
    <NavLink
      to={path}
      title={collapsed ? name : undefined}
      className={`relative flex items-center h-[48px] mx-1.5 ${roundedClass} text-sm font-bold transition-all duration-300 border-2 overflow-hidden ${isActive
        ? 'border-primary bg-primary text-text-heading shadow-sm'
        : 'border-transparent text-text-muted hover:text-text-heading hover:bg-primary/10 hover:border-primary/40'
        }`}
    >
      <div className="w-[44px] h-full flex items-center justify-center shrink-0">
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </div>

      <span className={`tracking-tight whitespace-nowrap transition-all duration-300 pr-4 ${collapsed ? 'lg:opacity-0 lg:max-w-0 lg:w-0' : 'opacity-100 max-w-[200px]'}`}>
        {name}
      </span>
    </NavLink>
  );
};

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const { user, isSuccess } = useSelector((state: RootState) => state.login);
  const userRole = user?.role;
  const dispatch = useDispatch();
  const location = useLocation();
  const hasShownWelcome = useRef(false);
  const expandTimeoutRef = useRef<any>(null);
  const { theme, toggleTheme } = useTheme();

  const { openDecidePopup, DecidePopup } = DecisionPopup();

  useEffect(() => {
    if (isSuccess && user && !hasShownWelcome.current) {
      dispatch(addToast({
        message: `Welcome back, ${user.full_name}!`,
        type: 'success'
      }));

      hasShownWelcome.current = true;
      dispatch(reset());
    }
  }, [isSuccess, user, dispatch]);

  const handleMobileToggle = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      expandTimeoutRef.current = setTimeout(() => {
        setIsMobileExpanded(true);
      }, 300);
    } else {
      setIsMobileExpanded(false);
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      setTimeout(() => {
        setIsSidebarOpen(false);
      }, 300);
    }
  };

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileExpanded(false);
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    setTimeout(() => setIsSidebarOpen(false), 300);
  }, [location.pathname]);

  // Defining navigation configuration
  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['superadmin', 'admin', 'teacher', 'student'], section: 'General' },
    { to: "/resources", label: "Resources", icon: FolderOpen, roles: ['teacher', 'student'], section: 'Learning' },
    { to: "/assessments", label: "Assessments", icon: FileText, roles: ['teacher', 'student'], section: 'Learning' },
    { to: "/sessions", label: "Sessions", icon: CalendarRange, roles: ['teacher', 'student'], section: 'Learning' },
    { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ['teacher', 'student'], section: 'Learning' },
    { to: "/organization", label: "Organization", icon: Building, roles: ['admin'], section: 'Administration' },
    { to: "/users", label: "Users", icon: UserCog2, roles: ['admin'], section: 'Administration' },
    { to: "/grades", label: "Grades", icon: School, roles: ['admin'], section: 'Administration' },
    { to: "/subjects", label: "Subjects", icon: BookCopy, roles: ['admin'], section: 'Administration' },
    { to: "/superadmin/manage/organizations", label: "Organizations", icon: Building2, roles: ['superadmin'], section: 'System' },
    { to: "/superadmin/manage/admins", label: "Org Admins", icon: Shield, roles: ['superadmin'], section: 'System' },
    { to: "/settings", label: "Settings", icon: Settings, roles: ['admin', 'teacher', 'student'], section: 'Preferences' },
  ];

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  // Desktop: expanded when hovered; Mobile: expanded sequenced after drop
  const isDesktopExpanded = isSidebarHovered;
  const isExpanded = isDesktopExpanded || isMobileExpanded;

  return (
    <div className="bg-bg font-sans flex flex-col h-screen overflow-hidden">
      {/* Premium Top Header */}
      <header className="sticky top-0 z-10 w-full bg-surface border-b border-light/5 shadow-md shadow-black/5 dark:shadow-none px-[2.5%] h-[70px] flex items-center justify-between rounded-b-3xl transition-all duration-300">

        {/* Left: Logo & Mobile Toggle */}
        <div className="flex-1 flex justify-start items-center gap-4">
          <button
            onClick={handleMobileToggle}
            className="lg:hidden p-2 text-primary hover:bg-primary/10 rounded-full transition-all border border-primary/20 z-[130]"
          >
            {isSidebarOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
          </button>
          <img
            className="w-24 lg:w-32 select-none"
            src={Logo}
            alt="EduSync"
          />
        </div>

        {/* Right: User Info & Logout */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="hidden lg:flex flex-col items-end text-xs font-semibold text-text-muted select-none">
            <span className="text-primary text-sm font-bold">{user?.full_name}</span>
            <div className="flex items-center gap-1 opacity-70">
              <span className="bg-primary/10 text-primary px-1.5 rounded uppercase text-[10px] font-bold">{user?.role}</span>
              <span>•</span>
              <span className="truncate max-w-[120px] text-text-body text-[11px] font-medium">{(user?.is_superuser || user?.role === 'superadmin') ? 'Administration' : user?.org_name}</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 text-primary hover:bg-primary/10 border border-primary/20 rounded-full transition-all duration-300 hover:cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() =>
              openDecidePopup({
                question: "Are you sure you want to logout?",
                confirmText: "Logout",
                cancelText: "Cancel",
                variant: 'primary',
                onConfirm: () => {
                  dispatch(logout());
                  dispatch(addToast({
                    message: "You have successfully logged out.",
                    type: 'success'
                  }));
                },
              })
            }
            className="flex text-failure font-bold hover:text-white items-center justify-center border-failure border-2 rounded-full w-10 h-10 transition-all duration-300 hover:bg-failure cursor-pointer active:translate-y-1 shadow-sm"
          >
            <Power size={18} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar Overlay (Mobile Backdrop) */}
        {isSidebarOpen && (
          <div
            onClick={handleMobileToggle}
            className="lg:hidden fixed inset-0 bg-bg/60 backdrop-blur-md z-[110] transition-all duration-300"
          />
        )}

        {/* Sidebar Structure Wrapper */}
        <div className="absolute top-4 sm:top-25 bottom-4 left-4 z-[120] flex flex-col items-start gap-4 pointer-events-none">

          {/* Premium Floating Dock Sidebar */}
          <aside
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
            className={`
              pointer-events-auto
              bg-surface/90 lg:bg-surface/80 backdrop-blur-2xl border-2 border-light/10 
              flex flex-col h-fit max-h-full rounded-[2rem] shadow-2xl
              transition-all duration-300 ease-in-out overflow-hidden
              ${isExpanded ? 'w-[260px]' : 'w-[64px]'}
              ${isSidebarOpen ? 'translate-y-0' : '-translate-y-[180%] lg:translate-y-0'}
            `}
          >
            {/* Dock Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-2">
              {filteredNavItems.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === filteredNavItems.length - 1;
                return (
                  <SidebarItem
                    key={item.to}
                    name={item.label}
                    path={item.to}
                    icon={item.icon}
                    collapsed={!isExpanded}
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                )
              })}
            </div>
          </aside>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden bg-bg relative lg:ml-[96px] lg:m-4 ">
          <Outlet />
        </main>
      </div>

      <DecidePopup />
    </div>
  );
};