import React, { useState } from 'react';
import { Room, User, CallLog, BottomNavTab } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { BottomNavBar } from './BottomNavBar.tsx';
import {
  Hash,
  Plus,
  Search,
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CheckCheck,
  Check,
  UserCheck,
  Info,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  rooms: Room[];
  users: User[];
  calls: CallLog[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
  onSelectDirectMessage: (user: User) => void;
  onStartCall: (targetUser: User, callType: 'voice' | 'video') => void;
  onOpenArchitecture: () => void;
  onOpenAuth: () => void;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  rooms,
  users,
  calls,
  activeRoomId,
  onSelectRoom,
  onOpenCreateRoom,
  onSelectDirectMessage,
  onStartCall,
  onOpenArchitecture,
  onOpenAuth,
  unreadCounts,
  typingUsers,
}) => {
  const { user, switchUser, logout, demoUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'online' | 'unread'>('all');

  const channelRooms = rooms.filter((r) => !r.isDirectMessage);
  const directRooms = rooms.filter((r) => r.isDirectMessage);
  const contacts = users.filter((u) => u.id !== user?.id);

  // Calculate unread counts by category for bottom nav badges
  const unreadChannelCount = channelRooms.reduce(
    (acc, r) => acc + (unreadCounts[r.id] || 0),
    0
  );
  const unreadDirectCount = directRooms.reduce(
    (acc, r) => acc + (unreadCounts[r.id] || 0),
    0
  );
  const missedCallsCount = calls.filter(
    (c) => c.status === 'missed' && c.receiverId === user?.id
  ).length;

  const formatLastSeen = (ts: number) => {
    if (!ts) return 'Offline';
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'recently';
  };

  const formatDuration = (sec: number) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Filtered lists
  const filteredChannels = channelRooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const dmRoom = directRooms.find((r) => r.participantIds.includes(c.id));
    const unread = dmRoom ? unreadCounts[dmRoom.id] || 0 : 0;

    if (chatFilter === 'online') return c.status === 'online';
    if (chatFilter === 'unread') return unread > 0;
    return true;
  });

  const filteredCalls = calls.filter(
    (call) =>
      call.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-white text-[#111b21] flex flex-col h-full border-r border-slate-200 select-none shrink-0">
      {/* Top Panel Title & Contextual Action */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#111b21]">
          {activeTab === 'chats' && 'Chats'}
          {activeTab === 'channels' && 'Channels'}
          {activeTab === 'calls' && 'Calls'}
          {activeTab === 'account' && 'Account & Settings'}
        </h2>

        {activeTab === 'channels' && (
          <button
            type="button"
            onClick={onOpenCreateRoom}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008069] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Channel</span>
          </button>
        )}
      </div>

      {/* Search Bar (shown on Chats, Channels, Calls) */}
      {activeTab !== 'account' && (
        <div className="px-3 pb-2.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={
                activeTab === 'chats'
                  ? 'Search direct messages or contacts...'
                  : activeTab === 'channels'
                  ? 'Search channels...'
                  : 'Search call history...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f0f2f5] text-[#111b21] placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#00a884]/30 border border-transparent focus:border-[#00a884] transition-all"
            />
          </div>

          {/* Interactive Filter Controls for Direct Chats */}
          {activeTab === 'chats' && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {(['all', 'online', 'unread'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setChatFilter(filterKey)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer capitalize whitespace-nowrap ${
                    chatFilter === filterKey
                      ? 'bg-[#d9fdd3] text-[#008069] font-semibold'
                      : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scrollable Tab Content Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {/* TAB 1: DIRECT CHATS (WhatsApp Direct Messages) */}
        {activeTab === 'chats' && (
          <div>
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No conversations match your filter.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isOnline = contact.status === 'online';
                const dmRoom = directRooms.find((r) =>
                  r.participantIds.includes(contact.id)
                );
                const isActive = dmRoom ? activeRoomId === dmRoom.id : false;
                const unread = dmRoom ? unreadCounts[dmRoom.id] || 0 : 0;
                const typingUser = dmRoom ? typingUsers[dmRoom.id] : undefined;
                const lastMsg = dmRoom?.lastMessage;

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => onSelectDirectMessage(contact)}
                    className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors cursor-pointer min-h-[68px] ${
                      isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={contact.avatar}
                        alt={contact.displayName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                          isOnline ? 'bg-[#25D366]' : 'bg-slate-400'
                        }`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#111b21] truncate">
                          {contact.displayName}
                        </span>
                        <span
                          className={`text-[11px] shrink-0 tabular-nums ${
                            unread > 0 ? 'text-[#00a884] font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {lastMsg?.createdAtFormatted ||
                            (isOnline ? 'Online' : formatLastSeen(contact.lastSeen))}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                          {typingUser ? (
                            <span className="text-[#00a884] font-medium">typing...</span>
                          ) : lastMsg ? (
                            <>
                              {lastMsg.senderId === user?.id && (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                              )}
                              <span className="truncate">{lastMsg.content}</span>
                            </>
                          ) : (
                            <span className="truncate">{contact.bio}</span>
                          )}
                        </div>

                        {unread > 0 && (
                          <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CHANNELS (WhatsApp Channels / Rooms) */}
        {activeTab === 'channels' && (
          <div>
            {filteredChannels.map((room) => {
              const isActive = activeRoomId === room.id;
              const unread = unreadCounts[room.id] || 0;
              const typingUser = typingUsers[room.id];
              const lastMsg = room.lastMessage;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors cursor-pointer min-h-[68px] ${
                    isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center shrink-0 font-bold">
                    <Hash className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#111b21] truncate">
                        #{room.name}
                      </span>
                      {lastMsg && (
                        <span
                          className={`text-[11px] shrink-0 tabular-nums ${
                            unread > 0 ? 'text-[#00a884] font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {lastMsg.createdAtFormatted}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-xs text-slate-500 truncate">
                        {typingUser ? (
                          <span className="text-[#00a884] font-medium">
                            {typingUser} is typing...
                          </span>
                        ) : lastMsg ? (
                          <span>
                            <strong className="font-medium text-slate-700">
                              {lastMsg.senderName}:
                            </strong>{' '}
                            {lastMsg.content}
                          </span>
                        ) : (
                          <span>{room.topic || room.description}</span>
                        )}
                      </div>

                      {unread > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 3: CALLS (Voice & Video Call History + Quick Dial) */}
        {activeTab === 'calls' && (
          <div className="divide-y divide-slate-100">
            {/* Quick Start Call Contacts Strip */}
            <div className="p-3.5 bg-[#f8fafc]">
              <div className="text-xs font-semibold text-slate-600 mb-2.5">
                Start a Voice or Video Call
              </div>
              <div className="space-y-2">
                {contacts.map((contact) => {
                  const isOnline = contact.status === 'online';
                  return (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/80"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={contact.avatar}
                            alt={contact.displayName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              isOnline ? 'bg-[#25D366]' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#111b21] truncate">
                            {contact.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {isOnline ? 'Online now' : `Last seen ${formatLastSeen(contact.lastSeen)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onStartCall(contact, 'voice')}
                          className="w-9 h-9 rounded-full hover:bg-[#d9fdd3] text-[#008069] flex items-center justify-center transition-colors cursor-pointer"
                          title={`Voice Call ${contact.displayName}`}
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStartCall(contact, 'video')}
                          className="w-9 h-9 rounded-full hover:bg-[#d9fdd3] text-[#008069] flex items-center justify-center transition-colors cursor-pointer"
                          title={`Video Call ${contact.displayName}`}
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Call Logs */}
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white">
                Recent Calls
              </div>
              {filteredCalls.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No recent calls recorded yet.
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const isOutgoing = call.callerId === user?.id;
                  const peerName = isOutgoing ? call.receiverName : call.callerName;
                  const peerAvatar = isOutgoing ? call.receiverAvatar : call.callerAvatar;
                  const peerId = isOutgoing ? call.receiverId : call.callerId;
                  const peerUser = users.find((u) => u.id === peerId) || {
                    id: peerId,
                    username: peerName.toLowerCase().replace(/\s+/g, '_'),
                    displayName: peerName,
                    email: '',
                    avatar: peerAvatar,
                    status: 'online' as const,
                    lastSeen: Date.now(),
                    bio: '',
                  };

                  return (
                    <div
                      key={call.id}
                      className="px-3.5 py-3 flex items-center justify-between hover:bg-[#f5f6f6] transition-colors min-h-[64px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={peerAvatar}
                          alt={peerName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-semibold truncate ${
                              call.status === 'missed' ? 'text-rose-600' : 'text-[#111b21]'
                            }`}
                          >
                            {peerName}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 tabular-nums">
                            {call.status === 'missed' ? (
                              <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : isOutgoing ? (
                              <PhoneOutgoing className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                            ) : (
                              <PhoneIncoming className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                            )}
                            <span>
                              {isOutgoing ? 'Outgoing' : call.status === 'missed' ? 'Missed' : 'Incoming'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {call.status === 'completed'
                                ? formatDuration(call.durationSeconds)
                                : call.status}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{call.formattedTime}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onStartCall(peerUser, call.callType)}
                        className="w-10 h-10 rounded-full hover:bg-[#d9fdd3] text-[#008069] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title={`Call ${peerName}`}
                      >
                        {call.callType === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT & SETTINGS */}
        {activeTab === 'account' && user && (
          <div className="p-4 space-y-5">
            {/* Active Profile Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f0f2f5]">
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#25D366] ring-2 ring-white" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-[#111b21] truncate">
                  {user.displayName}
                </div>
                <div className="text-xs text-slate-600 truncate">@{user.username}</div>
                <div className="text-xs text-[#008069] font-medium mt-0.5 truncate">
                  {user.bio}
                </div>
              </div>
            </div>

            {/* WebSocket Status Summary */}
            <div className="px-3.5 py-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                <span>WebSocket Handshake</span>
              </div>
              <span className="font-semibold text-[#008069]">Authenticated · Online</span>
            </div>

            {/* Instant Account Switcher for Multi-User Testing */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2 px-1">
                Switch Active Account (Instant Real-Time Test)
              </div>
              <div className="space-y-1.5">
                {demoUsers.map((dUser) => {
                  const isCurrent = user.username === dUser.username;
                  return (
                    <button
                      key={dUser.username}
                      type="button"
                      onClick={() => switchUser(dUser.username)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#d9fdd3] text-[#008069] font-semibold'
                          : 'hover:bg-[#f0f2f5] text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={dUser.avatar}
                          alt={dUser.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-[#111b21]">{dUser.name}</div>
                          <div className="text-[11px] text-slate-500">{dUser.role}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#008069]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#f0f2f5] flex items-center gap-2.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-[#008069]" />
                <span>Sign In or Register Custom Account</span>
              </button>

              <button
                type="button"
                onClick={onOpenArchitecture}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#f0f2f5] flex items-center gap-2.5 cursor-pointer"
              >
                <Info className="w-4 h-4 text-[#008069]" />
                <span>View Technical Architecture Summary</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar (Visible inside left panel on tablet/desktop) */}
      <div className="hidden md:block">
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          unreadDirectCount={unreadDirectCount}
          unreadChannelCount={unreadChannelCount}
          missedCallsCount={missedCallsCount}
        />
      </div>
    </aside>
  );
};
