import React, { useState, useEffect } from 'react';
import { ActiveCallSession } from '../types.ts';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Lock,
  Phone,
} from 'lucide-react';

interface ActiveCallModalProps {
  session: ActiveCallSession | null;
  currentUserAvatar?: string;
  currentUserName?: string;
  onEndCall: (durationSeconds: number, status: 'completed' | 'missed' | 'declined') => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  session,
  currentUserAvatar,
  currentUserName,
  onEndCall,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [seconds, setSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  useEffect(() => {
    if (!session) return;
    setCallState(session.isIncoming ? 'ringing' : 'ringing');
    setSeconds(0);
    setIsMuted(false);
    setIsCameraOn(session.callType === 'video');

    if (!session.isIncoming) {
      const connectTimer = setTimeout(() => {
        setCallState('connected');
      }, 1800);
      return () => clearTimeout(connectTimer);
    }
  }, [session]);

  useEffect(() => {
    if (!session || callState !== 'connected') return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session, callState]);

  if (!session) return null;

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangup = () => {
    const finalStatus = callState === 'connected' ? 'completed' : 'declined';
    onEndCall(seconds, finalStatus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-md flex flex-col items-center justify-between p-6 text-white select-none animate-in fade-in duration-150">
      {/* Top Encryption & Call Mode Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-[#00a884]" />
          <span>End-to-end encrypted · Real-time WebSocket Call</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mt-4 tracking-tight">
          {session.targetName}
        </h2>
        <p className="text-sm text-[#00a884] font-medium mt-1 tabular-nums">
          {callState === 'ringing'
            ? session.isIncoming
              ? `Incoming ${session.callType} call...`
              : 'Ringing...'
            : formatDuration(seconds)}
        </p>
      </div>

      {/* Center Avatar or Video Feed Stage */}
      <div className="relative flex-1 w-full max-w-lg flex items-center justify-center my-6">
        {session.callType === 'video' && isCameraOn && callState === 'connected' ? (
          <div className="relative w-full h-full max-h-[380px] rounded-3xl bg-[#111b21] border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
            <img
              src={session.targetAvatar}
              alt={session.targetName}
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-full object-cover ring-4 ring-[#00a884]/40 mb-3"
            />
            <span className="text-sm font-medium text-slate-300">
              {session.targetName} · HD Video Active
            </span>

            {/* Picture-in-Picture Self View */}
            <div className="absolute bottom-4 right-4 w-24 h-32 rounded-2xl bg-[#202c33] border border-slate-700 flex flex-col items-center justify-center shadow-lg">
              {currentUserAvatar && (
                <img
                  src={currentUserAvatar}
                  alt={currentUserName || 'You'}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <span className="text-[10px] text-slate-300 mt-1.5 font-medium">You</span>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center">
            {callState === 'ringing' && (
              <>
                <span className="absolute w-40 h-40 rounded-full bg-[#00a884]/20 animate-ping" />
                <span className="absolute w-48 h-48 rounded-full bg-[#00a884]/10 animate-pulse" />
              </>
            )}
            <img
              src={session.targetAvatar}
              alt={session.targetName}
              referrerPolicy="no-referrer"
              className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-[#00a884] shadow-2xl"
            />
            {session.targetSubtitle && (
              <p className="text-xs text-slate-400 mt-4">{session.targetSubtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Call Action Controls */}
      <div className="w-full max-w-md bg-[#1f2c34] border border-slate-800 rounded-3xl px-6 py-4 flex items-center justify-around shadow-2xl mb-2">
        <button
          type="button"
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isSpeakerOn
              ? 'bg-slate-700/80 text-white hover:bg-slate-600'
              : 'bg-white text-slate-900'
          }`}
          title={isSpeakerOn ? 'Mute Speaker' : 'Enable Speaker'}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isCameraOn
              ? 'bg-slate-700/80 text-white hover:bg-slate-600'
              : 'bg-white text-slate-900'
          }`}
          title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            !isMuted
              ? 'bg-slate-700/80 text-white hover:bg-slate-600'
              : 'bg-white text-slate-900'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {session.isIncoming && callState === 'ringing' && (
          <button
            type="button"
            onClick={() => setCallState('connected')}
            className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
            title="Answer Call"
          >
            <Phone className="w-6 h-6" />
          </button>
        )}

        <button
          type="button"
          onClick={handleHangup}
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
