'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Search, Users, Star, Archive, Trash2, CheckCircle2, AlertCircle, Plus, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MessageItem {
  id: string;
  sender: string;
  role: string;
  subject: string;
  snippet: string;
  time: string;
  unread: boolean;
  starred?: boolean;
}

const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 'MSG-101',
    sender: 'Ustadh Ahmad Al-Razi',
    role: 'Hifz & Quranic Studies Lead',
    subject: 'Juz 15 Memorization Assessment Results for SS3',
    snippet: 'Assalamu Alaikum, the oral evaluation scores for Juz 15 and Tajweed articulation have been published across the portal...',
    time: '10:42 AM',
    unread: true,
    starred: true
  },
  {
    id: 'MSG-102',
    sender: 'Fatima Al-Mansoor',
    role: 'Parent Guardian (Zaid Al-Mansoor)',
    subject: 'Inquiry regarding Term 2 Tuition clearance invoice',
    snippet: 'Respected Sheikh, we have initiated the bank wire transfer for Term 2 tuition fees (Ref #INV-8891). Kindly confirm...',
    time: 'Yesterday',
    unread: true
  },
  {
    id: 'MSG-103',
    sender: 'Central Academic Registrar',
    role: 'System Notification',
    subject: 'AY 2026/2027 Mid-Term Examination Timetable Finalized',
    snippet: 'All homeroom supervisors and subject teachers are requested to verify invigilation schedules before Friday...',
    time: 'July 15',
    unread: false
  },
  {
    id: 'MSG-104',
    sender: 'Director of Operations',
    role: 'Campus Management',
    subject: 'Friday Jumuah Prayer & Mosque Gate 1 Logistics',
    snippet: 'Please be advised that Gate 1 entry will be dedicated exclusively to scholar shuttle buses from 11:30 AM onwards...',
    time: 'July 14',
    unread: false,
    starred: true
  }
];

export default function MessagesCenterPage() {
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [selectedMsg, setSelectedMsg] = useState<MessageItem | null>(INITIAL_MESSAGES[0]);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'unread' | 'starred' | 'sent'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isNewCompose, setIsNewCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const filtered = messages.filter(m => {
    if (activeFolder === 'unread' && !m.unread) return false;
    if (activeFolder === 'starred' && !m.starred) return false;
    if (searchQuery && !m.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !m.sender.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    toast.success(`Reply dispatched to ${selectedMsg?.sender}`);
    setReplyText('');
  };

  const handleSendBroadcast = () => {
    if (!composeRecipient || !composeSubject) {
      toast.error('Please specify target recipient and subject.');
      return;
    }
    const newMsg: MessageItem = {
      id: `MSG-${Date.now()}`,
      sender: 'Sheikh Yahaya Camara',
      role: 'Executive Director',
      subject: composeSubject,
      snippet: composeBody || 'No content provided...',
      time: 'Just now',
      unread: false
    };
    setMessages([newMsg, ...messages]);
    setIsNewCompose(false);
    setComposeRecipient('');
    setComposeSubject('');
    setComposeBody('');
    toast.success('Broadcast message dispatched across institutional portal.');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Institutional Messaging & Communication Hub</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Secure intra-school communication portal linking teachers, parents, scholars, and executive administration.
          </p>
        </div>

        <button
          onClick={() => setIsNewCompose(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Message Broadcast</span>
        </button>
      </div>

      {/* Main Messaging Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Sidebar Folders */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4 flex flex-col">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1 flex-1">
            {[
              { id: 'inbox', label: 'All Inbox Messages', count: messages.length },
              { id: 'unread', label: 'Unread Priority', count: messages.filter(m => m.unread).length },
              { id: 'starred', label: 'Starred & Flagged', count: messages.filter(m => m.starred).length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id as any)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer",
                  activeFolder === f.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span>{f.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono",
                  activeFolder === f.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <span className="font-bold block mb-0.5">Push Notifications</span>
            Instant SMS & email alerts are active for urgent broadcast channels.
          </div>
        </div>

        {/* Center List Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs overflow-y-auto max-h-[700px] space-y-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No messages found under this category or search filter.
            </div>
          ) : (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMsg(msg);
                  setMessages(messages.map(m => m.id === msg.id ? { ...m, unread: false } : m));
                }}
                className={cn(
                  "p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5",
                  selectedMsg?.id === msg.id
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    {msg.unread && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                    <span>{msg.sender}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{msg.time}</span>
                </div>

                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {msg.subject}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {msg.snippet}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {msg.role}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMessages(messages.map(m => m.id === msg.id ? { ...m, starred: !m.starred } : m));
                    }}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Star className={cn("w-3.5 h-3.5", msg.starred ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Reader & Reply Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          {selectedMsg ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    {selectedMsg.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{selectedMsg.time}</span>
                </div>

                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {selectedMsg.subject}
                </h2>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    {selectedMsg.sender.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{selectedMsg.sender}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{selectedMsg.role}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p>{selectedMsg.snippet}</p>
                <p>
                  Respected institutional faculty and executive leaders, please verify your homeroom portal entries to ensure accurate calculation of attendance weighting and Hifz Qur'an progression before the end-of-term audit.
                </p>
                <p>
                  Was-Salamu Alaikum Warahmatullah,<br />
                  <strong>{selectedMsg.sender}</strong>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Write a direct reply to ${selectedMsg.sender}...`}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSendReply}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select a message from the left list to read its contents and reply.
            </div>
          )}
        </div>
      </div>

      {/* New Message Broadcast Modal */}
      {isNewCompose && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>Compose New Broadcast Message</span>
              </h3>
              <button onClick={() => setIsNewCompose(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience / Recipient</label>
                <select
                  value={composeRecipient}
                  onChange={(e) => setComposeRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Select recipient group or individual...</option>
                  <option value="All Faculty & Teachers">All Faculty & Sheikhs (Broadcast)</option>
                  <option value="All Parents & Guardians">All Parent Guardians (SIS Notification)</option>
                  <option value="All SS3 Scholars">Senior Secondary Grade 12 Scholars</option>
                  <option value="Hifz Track Mentors">Intensive Hifz Track Mentors</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g., Urgent: Term 2 End of Semester Examination Guidelines"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={5}
                  placeholder="Type your announcement or direct instruction here..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsNewCompose(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
