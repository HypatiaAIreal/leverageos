'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, LeverAction, Lever } from '@/lib/types';
import { getLevers, getChatMessages, saveChatMessages, clearChatMessages, generateId, getLanguage, saveLever } from '@/lib/store';
import PageTransition from '@/components/PageTransition';

function parseActions(text: string, levers: Lever[]): LeverAction[] {
  const actions: LeverAction[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^ACTION:\s*(\{.*\})\s*$/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.leverId && parsed.field && parsed.value !== undefined) {
          const lever = levers.find((l) => l.id === parsed.leverId);
          actions.push({
            leverId: parsed.leverId,
            leverName: parsed.leverName || lever?.name || 'Unknown',
            field: parsed.field,
            value: parsed.value,
          });
        }
      } catch {
        // skip malformed action
      }
    }
  }
  return actions;
}

function applyAction(action: LeverAction, levers: Lever[]): boolean {
  const lever = levers.find((l) => l.id === action.leverId);
  if (!lever) return false;

  const parts = action.field.split('.');
  if (parts[0] === 'properties' && (parts[1] === 'r' || parts[1] === 'l' || parts[1] === 'q')) {
    const val = Number(action.value);
    if (val >= 0 && val <= 10) {
      lever.properties[parts[1]] = val;
      lever.effectiveLeverage = lever.properties.r * lever.properties.l * lever.properties.q;
    }
  } else if (parts[0] === 'fulcrums' && parts.length === 3) {
    const fulcrumType = parts[1] as 'material' | 'epistemic' | 'relational';
    const field = parts[2] as 'status';
    if (field === 'status' && lever.fulcrums[fulcrumType]) {
      lever.fulcrums[fulcrumType].status = action.value as 'verified' | 'assumed' | 'at_risk' | 'absent';
      if (action.value === 'verified') {
        lever.fulcrums[fulcrumType].lastVerified = new Date().toISOString();
      }
    }
  }

  saveLever(lever);
  return true;
}

function stripActions(text: string): string {
  return text.split('\n').filter((line) => !line.match(/^ACTION:\s*\{/)).join('\n').trim();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [levers, setLevers] = useState<Lever[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getChatMessages());
    setLevers(getLevers());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const currentLevers = getLevers();
    setLevers(currentLevers);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveChatMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const lang = getLanguage();
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, levers: currentLevers, lang }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to chat');
      }

      const data = await res.json();
      const actions = parseActions(data.content, currentLevers);

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        actions: actions.length > 0 ? actions : undefined,
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = (messageId: string, actionIndex: number) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.actions?.[actionIndex]) return;

    const action = msg.actions[actionIndex];
    const currentLevers = getLevers();
    const success = applyAction(action, currentLevers);

    if (success) {
      const updated = messages.map((m) => {
        if (m.id === messageId && m.actions) {
          const newActions = [...m.actions];
          newActions[actionIndex] = { ...newActions[actionIndex], applied: true };
          return { ...m, actions: newActions };
        }
        return m;
      });
      setMessages(updated);
      saveChatMessages(updated);
      setLevers(getLevers());
    }
  };

  const handleClearChat = () => {
    clearChatMessages();
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Chat</h1>
            <p className="text-muted text-sm mt-1">Strategic advisor with portfolio context</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-3 py-1.5 text-xs text-muted/60 hover:text-at-risk border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Strategic Advisor</h2>
                <p className="text-muted text-sm mb-4">
                  I have full context on your lever portfolio ({levers.length} lever{levers.length !== 1 ? 's' : ''}).
                  Ask me anything about your leverage system.
                </p>
                <div className="space-y-2 text-xs text-muted/70">
                  <p>&quot;Which lever should I focus on this week?&quot;</p>
                  <p>&quot;My SaaS just lost a customer. How does that affect my system?&quot;</p>
                  <p>&quot;Should I lower the Rigidity on my side project?&quot;</p>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-accent/10 border border-accent/20'
                    : 'bg-surface border border-white/5'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${
                      msg.role === 'user' ? 'text-accent/60' : 'text-muted/60'
                    }`}>
                      {msg.role === 'user' ? 'You' : 'Advisor'}
                    </span>
                    <span className="text-[10px] text-muted/30 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {stripActions(msg.content)}
                  </div>

                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                      <p className="text-[10px] font-mono text-accent/60 uppercase tracking-wider">Suggested Changes</p>
                      {msg.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="flex-1 bg-white/[0.03] rounded-lg p-2">
                            <span className="text-foreground/70">
                              {action.leverName}: <span className="font-mono text-accent">{action.field}</span> &rarr; <span className="font-mono font-bold">{String(action.value)}</span>
                            </span>
                          </div>
                          {action.applied ? (
                            <span className="text-verified font-mono text-[10px] px-2">Applied</span>
                          ) : (
                            <motion.button
                              onClick={() => handleApplyAction(msg.id, i)}
                              className="px-3 py-1.5 bg-accent/20 text-accent border border-accent/30 rounded-lg text-[10px] font-medium hover:bg-accent/30 transition-colors whitespace-nowrap"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Apply
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-surface border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                  <span className="text-xs text-muted">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your leverage system..."
              className="flex-1 bg-surface border border-white/10 rounded-xl p-4 text-sm text-foreground placeholder:text-muted/30 outline-none resize-none h-14 max-h-32 focus:border-accent/30 transition-colors"
              rows={1}
            />
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 bg-accent text-background font-medium rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Send
            </motion.button>
          </div>
          <p className="text-[10px] text-muted/30 mt-2 text-center font-mono">
            The advisor can suggest changes to your levers. Click &quot;Apply&quot; to update your data.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
