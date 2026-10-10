import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, Lightbulb, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ChatMessage } from '@/types';

const suggestions = [
  'Which employees have overdue medical assessments?',
  'Summarise travel health risks for this month',
  'What is the compliance rate for Meridian Global Logistics?',
  'Which appointments need scheduling this week?',
];

const aiResponses: Record<string, string> = {
  'which employees have overdue medical assessments?':
    'There is currently **1 overdue medical assessment**:\n\n• **Sophie Dubois** — Meridian Global Logistics\n  Annual Occupational (was due 18 May 2025)\n  Status: On extended leave — HR has been notified for follow-up.\n\nI recommend scheduling this upon her return. Would you like me to draft a notification to the HR contact?',
  'summarise travel health risks for this month':
    'Here\'s your travel health summary for October 2025:\n\n• **3 deployments** to high-risk destinations (Lagos, Tema, Mombasa)\n• **1 action required**: Meningitis ACWY booster due for Michael Torres before Lagos deployment on 22 Oct\n• **1 in progress**: Japanese Encephalitis vaccination for Aisha Mohammed (Jakarta, 15 Oct)\n• **4 cleared** for travel\n\nMalaria prophylaxis has been issued for all high-risk destinations. Would you like a detailed risk breakdown per destination?',
  'what is the compliance rate for meridian global logistics?':
    'Meridian Global Logistics compliance summary:\n\n• **Medical compliance**: 92% (2,840 employees)\n• **Vaccine coverage**: 88%\n• **Travel readiness**: 76%\n• **Overdue assessments**: 1 (Sophie Dubois — on leave)\n• **Upcoming appointments**: 3 confirmed this week\n\nOverall status: **Good standing**. The only flag is the overdue assessment tied to an employee on extended leave.',
  'which appointments need scheduling this week?':
    'Appointments requiring attention this week (6–10 Oct):\n\n• **Liam MacKenzie** — Audiometry, 8 Oct 09:00, Aberdeen (Confirmed)\n• **Emma Larsson** — Follow-up, 6 Oct 14:30, Telemedicine (Confirmed)\n• **Aisha Mohammed** — Travel Vaccination, 7 Oct 11:00, Rotterdam (Confirmed)\n• **Fatima Hassan** — Pre-Employment Screening, 9 Oct 08:00, Dubai (Pending — needs confirmation)\n\nWould you like me to send reminders to the confirmed appointments or help confirm the pending one?',
};

function getAIResponse(query: string): string {
  const key = query.toLowerCase().trim();
  if (aiResponses[key]) return aiResponses[key];
  return `I understand you're asking about "${query}". Based on the current platform data, I can help you analyse workforce health trends, identify compliance gaps, flag travel health risks, and generate clinical insights. Could you rephrase your question using one of the suggested prompts, or ask about employees, companies, medicals, appointments, or travel health?`;
}

export function SteloAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Stelo AI, your occupational and travel health intelligence assistant. I can help you analyse workforce health data, identify compliance gaps, flag travel risks, and surface insights across your platform. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: new Date().toISOString() }]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-ink-900">Stelo AI</h2>
            <p className="text-sm text-ink-500">Your AI-powered occupational and travel health assistant</p>
          </div>
        </div>
      </div>

      {/* AI capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, title: 'Predictive insights', desc: 'Identify compliance gaps before they become risks.', color: 'bg-brand-50 text-brand-600' },
          { icon: AlertTriangle, title: 'Risk alerts', desc: 'Real-time flags for travel health and overdue assessments.', color: 'bg-warning-50 text-warning-600' },
          { icon: ShieldCheck, title: 'Compliance monitoring', desc: 'Continuous tracking across all contracted companies.', color: 'bg-success-50 text-success-600' },
        ].map((cap) => {
          const Icon = cap.icon;
          return (
            <div key={cap.title} className="card p-4 flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${cap.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{cap.title}</p>
                <p className="text-xs text-ink-500 mt-0.5">{cap.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat interface */}
      <div className="card flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-ink-200'}`}>
                {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <UserIcon size={16} className="text-ink-600" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === 'assistant' ? 'bg-ink-50 text-ink-800' : 'bg-brand-600 text-white'}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-ink-50 rounded-xl px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-ink-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-ink-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 bg-ink-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="flex items-center gap-1.5 text-xs text-ink-400 mb-2"><Lightbulb size={14} /> Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-ink-100">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Stelo AI about your workforce health data..."
              className="input flex-1"
            />
            <button type="submit" disabled={!input.trim()} className="btn-primary px-4">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
