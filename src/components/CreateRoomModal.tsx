import React, { useState } from 'react';
import { Hash, X } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, topic?: string) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreate(name.trim(), description.trim(), topic.trim());
      setName('');
      setDescription('');
      setTopic('');
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-[92vw] sm:w-full sm:max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#f0f2f5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center font-bold">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111b21]">Create Channel</h3>
              <p className="text-[11px] text-slate-500">Real-time room-based communication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Channel Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">#</span>
              <input
                type="text"
                placeholder="e.g. backend-updates"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 outline-hidden transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Channel names are formatted with lowercase and hyphens.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 outline-hidden resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Protocol design & latency optimization"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 outline-hidden transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#00a884] hover:bg-[#008069] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
