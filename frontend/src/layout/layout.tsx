import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { NavButton } from '../components/navItem.tsx';
import { DecisionPopup } from '../components/decision popup.tsx';
import { type RootState } from '../store';
import { LayoutDashboard, Power, FileText, FolderOpen, CalendarRange, UserCog2, BarChart3, Settings, Building, School,  BookCopy} from 'lucide-react';
import { useEffect, useRef } from 'react';

// Logos
import Logo from '../assets/logos/medium-logo.svg';

import { logout, reset } from '../features/login/loginSlice.ts';
import { addToast } from '../features/toasts/toastSlice.ts';

export const Layout = () => {
  const { user, isSuccess } = useSelector((state: RootState) => state.login);
  const userRole = user?.role;
  const dispatch = useDispatch();
  const hasShownWelcome = useRef(false);

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

  // Defining navigation configuration
  const navItems = [
    { to: "/",
      label: (
        <>
          <span className="lg:hidden">Home</span>
          <span className="hidden lg:inline">Dashboard</span>
        </>
      ), icon: <LayoutDashboard size={20} />, roles: ['Administrator', 'Teacher', 'Student'] },
    { to: "/resources", label: "Resources", icon: <FolderOpen size={20} />, roles: ['Teacher', 'Student'] },
    { to: "/assessments",
      label: (
        <>
          <span className="lg:hidden">Assess</span>
          <span className="hidden lg:inline">Assessments</span>
        </>
      ), icon: <FileText size={20} />, roles: ['Teacher', 'Student'] },
    { to: "/sessions", label: "Sessions", icon: <CalendarRange size={20} />, roles: [ 'Teacher', 'Student'] },
    { to: "/organization",
      label: (
        <>
          <span className="lg:hidden">Org.</span>
          <span className="hidden lg:inline">Organization</span>
        </>
      ), icon: <Building size={20} />, roles: ['Administrator'] },
    { to: "/users", label: "Users", icon: <UserCog2 size={20} />, roles: ['Administrator'] },
    { to: "/grades", label: "Grades", icon: <School size={20} />, roles: ['Administrator'] },
    { to: "/subjects", label: "Subjects", icon: <BookCopy size={20} />, roles: ['Administrator'] },
    { to: "/analytics", label: "Analytics", icon: <BarChart3 size={20} />, roles: ['Teacher', 'Student'] },
    { to: "/settings", label: "Settings", icon: <Settings size={20}/>, roles: ['Administrator', 'Teacher', 'Student'] },
  ];

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className="bg-bg font-sans flex flex-col items-center relative">

      <div className="m-auto bg-bg">

        {/* outlet renders the content */}
        <div className="w-full h-[93vh] sm:h-[94vh]">
          <Outlet />
        </div>
      </div>

      <div className="fixed bottom-0 lg:bottom-0 pt-0.5 left-0 w-full z-1 ">
        <div className="w-full flex justify-around items-center mb-2">
          <div className="absolute left-4 flex items-center">
            <img 
                className="hidden sm:block w-30" 
                src={Logo} 
                alt="EduSync" 
            />
          </div>
          <nav className="pointer-events-auto bg-surface border-3 border-light/50 px-1 lg:px-1.5 py-1  rounded-xl lg:rounded-full flex items-center gap-1.5 ">
                
            {filteredNavItems.map((item) => (
              <NavButton 
                key={item.to} 
                to={item.to} 
                label={item.label} 
                icon={item.icon} 
              />
            ))}
          </nav>
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
            className=" hidden md:flex text-failure font-bold hover:text-white absolute right-4 items-center justify-center border-failure border-2 rounded-4xl p-1 transition-all duration-100 hover:bg-failure cursor-pointer active:translate-y-1">
            <Power size={20} strokeWidth={3}/>
          </button>
        </div>
      </div>
      <DecidePopup />
    </div>
  );
};