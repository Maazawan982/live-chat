import React, { useState, useEffect, useRef } from 'react';
import { Room, Message, User } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { socketService } from '../services/socket.ts';
import {
  Send,
  Hash,
  Smile,
  Lock,
  CheckCheck,
  ChevronLeft,
  Phone,
  Video,
} from 'lucide-react';

interface ChatAreaProps {
  room: Room | null;
  messages: Message[];
  targetUser?: User | null;
  typingText?: string;
  onSendMessage: (content: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onStartCall: (callType: 'voice' | 'video') => void;
  onBackToMobileList?: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎉', '👀'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  room,
  messages,
  targetUser,
  typingText,
  onSendMessage,
  onReact,
  onStartCall,
  onBackToMobileList,
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!room) return;

    socketService.startTyping(room.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(room.id);
    }, 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !room) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.stopTyping(room.id);

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-slate-500 p-6 text-center select-none border-b-4 border-[#25D366]">
        <div className="w-16 h-16 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center mb-4">
          <Hash className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-[#111b21] mb-1">LiveChat Web</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          Select a direct chat, channel room, or start a voice/video call from the navigation bar.
        </p>
      </div>
    );
  }

  const isDM = room.isDirectMessage;
  const isTargetOnline = targetUser?.status === 'online';

  return (
    <main className="flex-1 flex flex-col h-full bg-[#efeae2] overflow-hidden w-full">
      {/* WhatsApp Style Conversation Header */}
      <header className="h-16 px-3 sm:px-5 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {onBackToMobileList && (
            <button
              type="button"
              onClick={onBackToMobileList}
              className="md:hidden w-10 h-10 -ml-1 text-slate-700 hover:bg-slate-200/70 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Back to list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {isDM ? (
            <div className="relative shrink-0">
              <img
                src={targetUser?.avatar}
                alt={targetUser?.displayName || room.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#f0f2f5] ${
                  isTargetOnline ? 'bg-[#25D366]' : 'bg-slate-400'
                }`}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#d9fdd3] flex items-center justify-center text-[#008069] font-bold shrink-0">
              <Hash className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#111b21] truncate">
              {isDM ? targetUser?.displayName || room.name : `#${room.name}`}
            </h2>

            <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
              {typingText ? (
                <span className="text-[#00a884] font-medium">{typingText}</span>
              ) : isDM ? (
                <>
                  <span>{isTargetOnline ? 'Online' : 'Offline'}</span>
                  {targetUser?.bio && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{targetUser.bio}</span>
                    </>
                  )}
                </>
              ) : (
                <span className="truncate">{room.topic || room.description}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions: Video Call & Voice Call */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onStartCall('video')}
            className="w-10 h-10 rounded-full hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Start Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onStartCall('voice')}
            className="w-10 h-10 rounded-full hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Start Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* WhatsApp Messages Stream */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 space-y-2.5 bg-[#efeae2]">
        {/* Encryption Notice */}
        <div className="flex justify-center my-2">
          <div className="bg-[#fff5c4] text-[#54656f] text-[11px] px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 max-w-md text-center">
            <Lock className="w-3.5 h-3.5 shrink-0 text-[#54656f]" />
            <span>
              Messages and calls in {isDM ? targetUser?.displayName : `#${room.name}`} are synced in real-time over authenticated WebSockets.
            </span>
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id;
          const showSenderHeader =
            !isMe && !isDM && (index === 0 || messages[index - 1]?.senderId !== msg.senderId);

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="relative group/bubble max-w-[85%] sm:max-w-md">
                <div
                  className={`px-3 pt-1.5 pb-1.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-2xs break-words ${
                    isMe
                      ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                      : 'bg-white text-[#111b21] rounded-tl-none'
                  }`}
                >
                  {showSenderHeader && (
                    <div className="text-[11px] font-bold text-[#008069] mb-0.5">
                      {msg.senderName}
                    </div>
                  )}

                  <div className="flex flex-wrap items-end gap-x-2">
                    <span className="break-words">{msg.content}</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500 select-none shrink-0 pt-1 tabular-nums">
                      <span>{msg.createdAtFormatted}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                    </span>
                  </div>
                </div>

                {/* Hover Emoji Reaction Bar */}
                <div
                  className={`absolute -top-3 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-200 shadow-md rounded-full px-1.5 py-0.5 z-10 ${
                    isMe ? 'left-0' : 'right-0'
                  }`}
                >
                  {COMMON_EMOJIS.slice(0, 4).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReact(msg.id, emoji)}
                      className="hover:scale-125 transition-transform text-xs p-0.5 cursor-pointer"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing Reactions */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 -mt-1 z-10 ${
                    isMe ? 'justify-end pr-2' : 'justify-start pl-2'
                  }`}
                >
                  {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                    const hasReacted = user ? userIds.includes(user.id) : false;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReact(msg.id, emoji)}
                        className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs border transition-colors cursor-pointer tabular-nums ${
                          hasReacted
                            ? 'bg-[#d9fdd3] border-[#00a884]/40 text-[#111b21] font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px]">{userIds.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time Typing Indicator Bubble */}
        {typingText && (
          <div className="flex items-center gap-2 text-xs text-slate-600 py-1.5 px-3 bg-white rounded-xl rounded-tl-none w-fit shadow-2xs">
            <div className="flex space-x-1 items-center">
              <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" />
            </div>
            <span className="font-medium text-[#008069] text-[11px]">{typingText}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Input Composer */}
      <footer className="px-3 py-2.5 bg-[#f0f2f5] shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(showEmojiPicker ? null : 'active')}
              className="w-10 h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              title="Insert Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex items-center gap-1 z-30">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(null);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-lg hover:scale-115 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder={
              isDM
                ? `Type a message to ${targetUser?.displayName || 'contact'}`
                : `Type a message in #${room.name}`
            }
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#111b21] placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#00a884]/30 min-w-0 shadow-2xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              inputText.trim()
                ? 'bg-[#00a884] hover:bg-[#008069] text-white shadow-xs active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </main>
  );
};
