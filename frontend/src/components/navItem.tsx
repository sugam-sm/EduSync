import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavButtonProps {
  to: string;
  label: React.ReactNode;
  icon: React.ReactNode;
}

export const NavButton = ({ to, label, icon }: NavButtonProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col lg:flex-row w-13.75 lg:w-full items-center justify-center gap-1/2 lg:gap-1 px-1 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-full font-semibold transition-all duration-100 active:translate-y-0.5  ${
        isActive
          ? 'bg-primary text-text-heading' 
          : 'text-text-muted hover:text-text-heading hover:bg-primary/50'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span className="shrink-0 transition-all duration-300">
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<any>, { 
                strokeWidth: isActive ? 2.5 : 2 
              }) 
            : icon}
        </span>
        
        <span className="text-[10.5px] lg:block lg:text-sm leading-none duration-300">
          {label}
        </span>
      </>
    )}
  </NavLink>
);