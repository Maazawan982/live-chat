import React from 'react';
import { BottomNavTab } from '../types.ts';
import { MessageSquare, Radio, Phone, UserCheck } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  unreadDirectCount: number;
  unreadChannelCount: number;
  missedCallsCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  unreadDirectCount,
  unreadChannelCount,
  missedCallsCount = 0,
}) => {
  const navItems: {
    id: BottomNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadDirectCount,
    },
    {
      id: 'channels',
      label: 'Channels',
      icon: Radio,
      badge: unreadChannelCount,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: Phone,
      badge: missedCallsCount,
    },
    {
      id: 'account',
      label: 'Account',
      icon: UserCheck,
    },
  ];

  return (
    <nav
      aria-label="Primary bottom navigation"
      className="h-16 bg-white border-t border-slate-200 px-2 grid grid-cols-4 items-center shrink-0 select-none z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className="flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#00a884]"
          >
            <div
              className={`relative flex items-center justify-center px-4 py-1 rounded-full transition-colors ${
                isActive
                  ? 'bg-[#d9fdd3] text-[#008069]'
                  : 'text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.9px]'}`} />

              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-2xs">
                  {item.badge}
                </span>
              )}
            </div>

            <span
              className={`text-[11px] mt-0.5 tracking-tight whitespace-nowrap ${
                isActive ? 'font-bold text-[#111b21]' : 'font-medium text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
