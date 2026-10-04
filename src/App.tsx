import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatArea } from './components/ChatArea.tsx';
import { BottomNavBar } from './components/BottomNavBar.tsx';
import { ActiveCallModal } from './components/ActiveCallModal.tsx';
import { CreateRoomModal } from './components/CreateRoomModal.tsx';
import { ArchitectureModal } from './components/ArchitectureModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { api } from './services/api.ts';
import { socketService } from './services/socket.ts';
import {
  Room,
  User,
  Message,
  TypingState,
  CallLog,
  BottomNavTab,
  ActiveCallSession,
} from './types.ts';

function ChatDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<BottomNavTab>('chats');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('dm_user_maaz_user_sarah');
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const [activeTypingText, setActiveTypingText] = useState<string>('');

  // Mobile responsive view state: 'list' shows the active tab list + bottom nav; 'chat' shows conversation
  const [mobileScreen, setMobileScreen] = useState<'list' | 'chat'>('list');

  // Modals & Live Call state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<ActiveCallSession | null>(null);

  // 1. Fetch Rooms, Users, and Call Logs
  const loadInitialData = useCallback(async () => {
    if (!token) return;
    try {
      const [fetchedRooms, fetchedUsers, fetchedCalls] = await Promise.all([
        api.getRooms(token),
        api.getUsers(token),
        api.getCalls(token),
      ]);
      setRooms(fetchedRooms);
      setUsers(fetchedUsers);
      setCalls(fetchedCalls);

      if (!activeRoomId && fetchedRooms.length > 0) {
        setActiveRoomId(fetchedRooms[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial chat data:', err);
    }
  }, [token, activeRoomId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Fetch Messages when activeRoomId changes
  useEffect(() => {
    if (!token || !activeRoomId) return;

    let isMounted = true;
    api
      .getMessages(token, activeRoomId)
      .then((history) => {
        if (isMounted) {
          setMessages(history);
        }
      })
      .catch((err) => {
        console.error('Failed to load room messages:', err);
      });

    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[activeRoomId];
      return updated;
    });

    setActiveTypingText(
      typingMap[activeRoomId] ? `${typingMap[activeRoomId]} is typing...` : ''
    );

    socketService.joinRoom(activeRoomId);

    return () => {
      isMounted = false;
    };
  }, [activeRoomId, token, typingMap]);

  // 3. Socket Event Subscriptions
  useEffect(() => {
    const unsubMsg = socketService.onMessage((newMsg: Message) => {
      // Update room's lastMessage preview in sidebar
      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === newMsg.roomId
            ? {
                ...r,
                lastMessage: {
                  content: newMsg.content,
                  senderName: newMsg.senderName,
                  senderId: newMsg.senderId,
                  createdAtFormatted: newMsg.createdAtFormatted,
                  timestamp: newMsg.timestamp,
                },
              }
            : r
        )
      );

      if (newMsg.roomId === activeRoomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMsg.roomId]: (prev[newMsg.roomId] || 0) + 1,
        }));
      }
    });

    const unsubReaction = socketService.onReaction(({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, reactions } : msg))
      );
    });

    const unsubPresence = socketService.onPresence(({ userId, status, lastSeen }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status, lastSeen } : u))
      );
    });

    const unsubTyping = socketService.onTyping((payload: TypingState) => {
      if (payload.userId === user?.id) return;

      setTypingMap((prev) => {
        const next = { ...prev };
        if (payload.isTyping) {
          next[payload.roomId] = payload.username;
        } else {
          delete next[payload.roomId];
        }
        return next;
      });

      if (payload.roomId === activeRoomId) {
        setActiveTypingText(payload.isTyping ? `${payload.username} is typing...` : '');
      }
    });

    const unsubConn = socketService.onConnection((data) => {
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          status: data.onlineUsers.includes(u.id) ? 'online' : 'offline',
        }))
      );
    });

    const unsubIncomingCall = socketService.onIncomingCall((data) => {
      if (data.callerId === user?.id) return;
      setActiveCall({
        targetId: data.callerId,
        targetName: data.callerName,
        targetAvatar: data.callerAvatar,
        targetSubtitle: 'Incoming Real-Time Call',
        callType: data.callType,
        isIncoming: true,
      });
    });

    const unsubCallLog = socketService.onCallLogAdded((newCall: CallLog) => {
      setCalls((prev) => {
        if (prev.some((c) => c.id === newCall.id)) return prev;
        return [newCall, ...prev];
      });
    });

    return () => {
      unsubMsg();
      unsubReaction();
      unsubPresence();
      unsubTyping();
      unsubConn();
      unsubIncomingCall();
      unsubCallLog();
    };
  }, [activeRoomId, user?.id]);

  // Handlers
  const handleSelectTab = (tab: BottomNavTab) => {
    setActiveTab(tab);
    setMobileScreen('list');
  };

  const handleSelectChannelRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setMobileScreen('chat');
  };

  const handleSelectDirectMessage = async (targetUser: User) => {
    if (!token) return;
    try {
      const dmRoom = await api.getOrCreateDirectRoom(token, targetUser.id);
      setRooms((prev) => {
        if (!prev.some((r) => r.id === dmRoom.id)) {
          return [...prev, dmRoom];
        }
        return prev;
      });
      setActiveRoomId(dmRoom.id);
      setMobileScreen('chat');
    } catch (err) {
      console.error('Failed to open DM room:', err);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!activeRoomId || !content.trim()) return;

    const currentRoom = rooms.find((r) => r.id === activeRoomId);
    let receiverId: string | undefined = undefined;

    if (currentRoom?.isDirectMessage) {
      receiverId = currentRoom.participantIds.find((id) => id !== user?.id);
    }

    socketService.sendMessage(activeRoomId, content, receiverId);
  };

  const handleCreateRoom = async (name: string, description: string, topic?: string) => {
    if (!token) return;
    const newRoom = await api.createRoom(token, name, description, topic);
    setRooms((prev) => [...prev, newRoom]);
    setActiveRoomId(newRoom.id);
    setActiveTab('channels');
    setMobileScreen('chat');
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!activeRoomId) return;
    socketService.reactToMessage(messageId, emoji, activeRoomId);
  };

  const handleStartCallWithUser = (targetUser: User, callType: 'voice' | 'video') => {
    socketService.startCall(targetUser.id, callType);
    setActiveCall({
      targetId: targetUser.id,
      targetName: targetUser.displayName,
      targetAvatar: targetUser.avatar,
      targetSubtitle: targetUser.bio,
      callType,
      isIncoming: false,
    });
  };

  const handleStartCallInCurrentRoom = (callType: 'voice' | 'video') => {
    const currentRoom = rooms.find((r) => r.id === activeRoomId);
    if (!currentRoom) return;

    if (currentRoom.isDirectMessage && user) {
      const peerId = currentRoom.participantIds.find((id) => id !== user.id);
      const peer = users.find((u) => u.id === peerId);
      if (peer) {
        handleStartCallWithUser(peer, callType);
        return;
      }
    }

    // Group channel call
    setActiveCall({
      targetId: currentRoom.id,
      targetName: `#${currentRoom.name}`,
      targetAvatar: user?.avatar || '',
      targetSubtitle: `Channel ${callType} call`,
      callType,
      isIncoming: false,
    });
  };

  const handleEndCall = (
    durationSeconds: number,
    status: 'completed' | 'missed' | 'declined'
  ) => {
    if (!activeCall) return;
    socketService.endCall(
      activeCall.targetId,
      activeCall.callType,
      durationSeconds,
      status
    );
    setActiveCall(null);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f0f2f5] text-[#111b21]">
        <div className="w-10 h-10 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">
          Connecting to LiveChat WebSocket Server...
        </p>
      </div>
    );
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const targetUser =
    activeRoom?.isDirectMessage && user
      ? users.find((u) => u.id === activeRoom.participantIds.find((id) => id !== user.id))
      : null;

  const channelRooms = rooms.filter((r) => !r.isDirectMessage);
  const directRooms = rooms.filter((r) => r.isDirectMessage);
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f0f2f5] overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel (Sidebar with Chats / Channels / Calls / Account) */}
        <div
          className={`${
            mobileScreen === 'list' ? 'flex w-full' : 'hidden'
          } md:flex md:w-80 lg:w-96 h-full shrink-0`}
        >
          <Sidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            rooms={rooms}
            users={users}
            calls={calls}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectChannelRoom}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
            onSelectDirectMessage={handleSelectDirectMessage}
            onStartCall={handleStartCallWithUser}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            unreadCounts={unreadCounts}
            typingUsers={typingMap}
          />
        </div>

        {/* Right Panel (WhatsApp Conversation View) */}
        <div
          className={`${
            mobileScreen === 'chat' ? 'flex w-full' : 'hidden'
          } md:flex flex-1 h-full overflow-hidden`}
        >
          <ChatArea
            room={activeRoom}
            messages={messages}
            targetUser={targetUser}
            typingText={activeTypingText}
            onSendMessage={handleSendMessage}
            onReact={handleReact}
            onStartCall={handleStartCallInCurrentRoom}
            onBackToMobileList={() => setMobileScreen('list')}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Always visible on mobile screens for 1-tap switching between Chats, Channels, Calls & Account) */}
      <div className="md:hidden shrink-0">
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          unreadDirectCount={unreadDirectCount}
          unreadChannelCount={unreadChannelCount}
          missedCallsCount={missedCallsCount}
        />
      </div>

      {/* Active Voice / Video Call Modal */}
      <ActiveCallModal
        session={activeCall}
        currentUserAvatar={user?.avatar}
        currentUserName={user?.displayName}
        onEndCall={handleEndCall}
      />

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreate={handleCreateRoom}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatDashboard />
    </AuthProvider>
  );
}
