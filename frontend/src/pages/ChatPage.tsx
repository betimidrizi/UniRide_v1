import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, RefreshCw, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { chatApi } from '@/api/chat';
import { extractError } from '@/api/client';
import { joinConversation, leaveConversation, onMessage, onUnreadCountChanged } from '@/api/realtime';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ChatMsg = Awaited<ReturnType<typeof chatApi.conversation>>[number];
type DayGroup = { key: string; label: string; items: ChatMsg[] };

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ChatPage() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const selectedRideId = Number(params.get('rideId')) || null;
  const selectedOtherId = Number(params.get('otherUserId')) || null;

  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ['chat', 'threads'],
    queryFn: chatApi.threads
  });

  const conversationKey = useMemo(
    () => ['chat', 'conversation', selectedRideId, selectedOtherId] as const,
    [selectedOtherId, selectedRideId]
  );
  const { data: messages, isLoading: convoLoading } = useQuery<ChatMsg[]>({
    queryKey: conversationKey,
    queryFn: () => chatApi.conversation(selectedRideId!, selectedOtherId!),
    enabled: Boolean(selectedRideId && selectedOtherId)
  });

  useEffect(() => {
    const offMessage = onMessage((message) => {
      const belongsToOpenConversation =
        message.rideId === selectedRideId &&
        (
          (message.senderId === user?.id && message.receiverId === selectedOtherId) ||
          (message.senderId === selectedOtherId && message.receiverId === user?.id)
        );

      if (belongsToOpenConversation) {
        qc.setQueryData<ChatMsg[]>(conversationKey, (current = []) => {
          if (current.some((m) => m.chatMessageId === message.chatMessageId)) return current;
          return [...current, message];
        });
      }

      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    });

    const offUnread = onUnreadCountChanged((count) => {
      qc.setQueryData(['unread-count'], count);
      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
    });

    return () => {
      offMessage();
      offUnread();
    };
  }, [conversationKey, qc, selectedOtherId, selectedRideId, user?.id]);

  useEffect(() => {
    if (!selectedRideId || !selectedOtherId) return;

    let active = true;
    joinConversation(selectedRideId, selectedOtherId)
      .then(() => {
        if (active) {
          qc.invalidateQueries({ queryKey: conversationKey });
          qc.invalidateQueries({ queryKey: ['unread-count'] });
        }
      })
      .catch(() => {
        if (active) toast.error('Realtime chat connection failed.');
      });

    return () => {
      active = false;
      leaveConversation(selectedRideId, selectedOtherId).catch(() => undefined);
    };
  }, [conversationKey, qc, selectedOtherId, selectedRideId]);

  const activeThread = useMemo(
    () => threads?.find((t) => t.rideId === selectedRideId && t.otherUserId === selectedOtherId),
    [threads, selectedRideId, selectedOtherId]
  );

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll ONLY the messages container — using scrollIntoView() propagates
    // up the ancestor chain and ends up scrolling the whole window/page.
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages?.length]);

  const [showTyping, setShowTyping] = useState(false);
  useEffect(() => {
    if (!selectedRideId || !selectedOtherId) return;
    setShowTyping(true);
    const id = window.setTimeout(() => setShowTyping(false), 2000);
    return () => window.clearTimeout(id);
  }, [selectedRideId, selectedOtherId]);

  const grouped = useMemo<DayGroup[]>(() => {
    if (!messages) return [];
    const groups: DayGroup[] = [];
    for (const m of messages) {
      const k = dayKey(m.sentAt);
      const last = groups[groups.length - 1];
      if (last && last.key === k) last.items.push(m);
      else groups.push({ key: k, label: dayLabel(m.sentAt), items: [m] });
    }
    return groups;
  }, [messages]);

  const msgCount = messages?.length ?? 0;
  const headerLoading = convoLoading && msgCount === 0;

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedRideId || !selectedOtherId) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLTextAreaElement;
    const text = input.value.trim();
    if (!text) return;
    try {
      const sent = await chatApi.send(selectedRideId, selectedOtherId, text);
      qc.setQueryData<ChatMsg[]>(conversationKey, (current = []) => {
        if (current.some((m) => m.chatMessageId === sent.chatMessageId)) return current;
        return [...current, sent];
      });
      input.value = '';
      input.focus();
      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  function select(rideId: number, otherUserId: number) {
    setParams({ rideId: String(rideId), otherUserId: String(otherUserId) });
    qc.invalidateQueries({ queryKey: ['unread-count'] });
  }

  return (
    <>
      <PageHeader eyebrow="Messages" title="Chat" subtitle="Coordinate the trip." />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-13rem)]">
        {/* Inbox */}
        <aside className="glass p-3 flex flex-col min-h-0">
          <div className="px-2 py-2 mb-1 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Inbox</h2>
            <button
              className="btn-ghost !p-2"
              onClick={() => qc.invalidateQueries({ queryKey: ['chat', 'threads'] })}
              title="Refresh"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-1">
            {threadsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : threads && threads.length > 0 ? (
              threads.map((t) => {
                const active = t.rideId === selectedRideId && t.otherUserId === selectedOtherId;
                return (
                  <button
                    key={`${t.rideId}-${t.otherUserId}`}
                    onClick={() => select(t.rideId, t.otherUserId)}
                    className={cn(
                      'relative w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all',
                      active
                        ? 'bg-gradient-to-r from-brand-500/20 via-fuchsia-500/10 to-transparent border border-brand-400/30 shadow-glow'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    )}
                  >
                    <Avatar name={t.otherUserName} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate">{t.otherUserName}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">{formatRelative(t.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{t.route}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</p>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-fuchsia-500 text-white">
                        {t.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="grid place-items-center text-center p-6 text-slate-500 text-sm">
                <MessageCircle className="size-8 text-slate-600 mb-2" />
                No conversations yet.
              </div>
            )}
          </div>
        </aside>

        {/* Conversation */}
        <section className="glass flex flex-col min-h-0">
          {selectedRideId && selectedOtherId ? (
            <>
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                {headerLoading ? (
                  <Skeleton className="h-16 w-2/3" />
                ) : (
                  <>
                    <Avatar name={activeThread?.otherUserName || 'User'} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">
                        {activeThread?.otherUserName || 'Conversation'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        Ride #{selectedRideId} · {activeThread?.route ?? '—'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 overscroll-contain">
                {convoLoading && msgCount === 0 ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className={i % 2 ? 'h-12 w-1/2 ml-auto' : 'h-12 w-2/3'} />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {grouped.map((g) => (
                      <Fragment key={g.key}>
                        <div className="my-3 flex items-center gap-3">
                          <span className="flex-1 h-px bg-white/10" />
                          <span className="text-[11px] uppercase tracking-wider text-slate-300">
                            {g.label}
                          </span>
                          <span className="flex-1 h-px bg-white/10" />
                        </div>
                        {g.items.map((m) => {
                          const outgoing = m.senderId === user?.id;
                          return (
                            <motion.div
                              key={m.chatMessageId}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn('flex', outgoing ? 'justify-end' : 'justify-start')}
                            >
                              <div
                                className={cn(
                                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                                  outgoing
                                    ? 'bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white rounded-br-md shadow-glow'
                                    : 'bg-white/[0.06] border border-white/10 text-slate-100 rounded-bl-md'
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words">{m.message}</p>
                                <p
                                  className={cn(
                                    'text-[10px] mt-1 opacity-70 flex items-center gap-1',
                                    outgoing ? 'justify-end' : 'justify-start'
                                  )}
                                >
                                  <span>{formatDateTime(m.sentAt)}</span>
                                  {outgoing && (m.isRead
                                    ? <CheckCheck className="size-3 text-info-400" />
                                    : <Check className="size-3 opacity-70" />)}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="grid place-items-center text-center text-slate-500 text-sm py-12">
                    <MessageCircle className="size-8 text-slate-600 mb-2" />
                    Be the first to say hi.
                  </div>
                )}
                {showTyping && messages && activeThread && (
                  <div className="flex items-center gap-2 text-xs text-slate-300 px-3">
                    <div className="size-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <div className="size-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <div className="size-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span>{activeThread.otherUserName} is typing…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={send} className="p-3 border-t border-white/5 flex items-end gap-2">
                <textarea
                  name="message"
                  rows={1}
                  required
                  placeholder="Type a message…"
                  className="input resize-none min-h-[44px] max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).form?.requestSubmit();
                    }
                  }}
                />
                <button className="btn-primary !py-3" type="submit">
                  <Send className="size-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center p-10 text-slate-400">
              <div>
                <MessageCircle className="size-10 mx-auto text-slate-600 mb-3" />
                <p className="font-display text-lg font-bold text-white mb-1">Pick a conversation</p>
                <p className="text-sm text-slate-500">
                  Or open a chat from your reservations / passenger list.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
