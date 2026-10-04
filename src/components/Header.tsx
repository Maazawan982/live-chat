import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { socketService } from '../services/socket.ts';
import { BottomNavTab } from '../types.ts';
import { ChevronDown, Check, LogOut, Info, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  onOpenArchitecture: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenArchitecture,
  onOpenAuth,
}) => {
  const { user, switchUser, logout, demoUsers } = useAuth();
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkSocket = () => {
      const s = socketService.getSocket();
      setSocketConnected(!!s?.connected);
    };

    const interval = setInterval(checkSocket, 1000);
    checkSocket();

    const unsubConn = socketService.onConnection(() => {
      setSocketConnected(true);
    });

    return () => {
      clearInterval(interval);
      unsubConn();
    };
  }, []);

  return (
    <header className="h-14 bg-[#008069] text-white px-4 flex items-center justify-between select-none z-20 shrink-0 shadow-xs">
      {/* Zone 1: Single-line Brand Wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.95-1.27-4.88-4.25-5.03-4.45-.15-.2-1.2-1.6-1.2-3.05s.76-2.16 1.03-2.46c.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.65-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.71-.16 1.39z" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          LiveChat
        </span>
      </div>

      {/* Zone 2: Clean Single-Line Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/85">
        <button
          type="button"
          onClick={() => onSelectTab('chats')}
          className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
            activeTab === 'chats'
              ? 'border-white text-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          Direct Chats
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('channels')}
          className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
            activeTab === 'channels'
              ? 'border-white text-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          Channels
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('calls')}
          className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
            activeTab === 'calls'
              ? 'border-white text-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          Calls
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('account')}
          className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
            activeTab === 'account'
              ? 'border-white text-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          Account
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Architecture Specs & User Switcher) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/15 hover:bg-white/25 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          title="View Technical Architecture & WebSocket Diagnostics"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Architecture</span>
        </button>

        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-full transition-colors cursor-pointer"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-[#008069] ${
                    socketConnected ? 'bg-[#25D366]' : 'bg-amber-400'
                  }`}
                />
              </div>
              <span className="text-xs font-semibold text-white hidden sm:inline whitespace-nowrap">
                {user.displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-3.5 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  Switch Active User
                </div>
                <div className="py-1">
                  {demoUsers.map((dUser) => {
                    const isCurrent = user.username === dUser.username;
                    return (
                      <button
                        key={dUser.username}
                        type="button"
                        onClick={() => switchUser(dUser.username)}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#f0f2f5] text-[#008069] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={dUser.avatar}
                            alt={dUser.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold text-slate-800">{dUser.name}</div>
                            <div className="text-[11px] text-slate-500">{dUser.role}</div>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-[#008069]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#008069]" />
                    <span>Custom Account / Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
