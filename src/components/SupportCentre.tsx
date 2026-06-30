import React, { useState, useEffect } from 'react';
import { SupportTicket } from '../types';
import { MessageSquare, AlertCircle, Send, CheckCircle2, LifeBuoy, Clock, ArrowRight } from 'lucide-react';

export default function SupportCentre() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'booking' | 'payment' | 'vendor' | 'other'>('booking');
  const [message, setMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Chat message input
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        if (data.length > 0 && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Poll for replies (simulates real-time operator updates)
  useEffect(() => {
    if (!selectedTicket) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/support/tickets');
        if (res.ok) {
          const data = await res.json();
          const updated = data.find((t: any) => t.id === selectedTicket.id);
          if (updated && JSON.stringify(updated.replies) !== JSON.stringify(selectedTicket.replies)) {
            setSelectedTicket(updated);
            // Sync in main list
            setTickets(data);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTicket]);

  // Handle Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message })
      });

      if (res.ok) {
        const ticket = await res.json();
        setTickets([ticket, ...tickets]);
        setSelectedTicket(ticket);
        
        // Reset
        setSubject('');
        setMessage('');
        alert('Support request logged. An operator will coordinate shortly.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Handle Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, sender: 'user' })
      });

      if (res.ok) {
        const updatedTicket = await res.json();
        setSelectedTicket(updatedTicket);
        // Sync in main list
        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setReplyText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div id="support-centre-view" className="space-y-8 pb-16">
      
      {/* Intro Header */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <LifeBuoy className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] uppercase tracking-tight">24/7 Operations Support</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time support coordination with regional operators, mountain guides, and payment clearing offices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="support-main-grid">
        
        {/* Left Column: Tickets List and Filing form */}
        <aside className="lg:col-span-4 space-y-6" id="support-left-sidebar">
          
          {/* Support Ticket File Form */}
          <form onSubmit={handleCreateTicket} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs" id="form-file-ticket">
            <h3 className="text-xs font-bold uppercase text-[#0F172A] border-b border-slate-100 pb-2.5 flex items-center gap-1.5 tracking-wider">
              File Support Ticket
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subject</label>
              <input
                type="text"
                required
                id="ticket-subject"
                placeholder="e.g. Booking b-991 Airport Shuttle"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              >
                <option value="booking">🏨 Hotel / Stay Booking</option>
                <option value="payment">💳 Wallet or Card Payment</option>
                <option value="vendor">💼 Vendor Partnership</option>
                <option value="other">💬 General Query</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Query / Requirements</label>
              <textarea
                required
                id="ticket-message"
                rows={3}
                placeholder="Elaborate your request details. Include booking IDs for rapid response clearance..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              id="btn-file-ticket"
              disabled={submittingTicket}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>{submittingTicket ? 'Filing...' : 'Transmit Ticket'}</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Active Tickets List */}
          <div className="space-y-3" id="active-tickets-list">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Open Coordinates</h4>
            {loading ? (
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Syncing tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No active support logs.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`ticket-selector-btn-${t.id}`}
                      onClick={() => setSelectedTicket(t)}
                      className={`w-full text-left p-4 rounded-lg border flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/40' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">ID: {t.id}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          t.status === 'open' 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>{t.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">{t.subject}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Live Chat Operator Desk */}
        <main className="lg:col-span-8 flex flex-col justify-between" id="chat-operator-desk">
          {selectedTicket ? (
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col justify-between h-[540px] shadow-xs relative" id="ticket-chat-frame">
              {/* Chat Header */}
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-indigo-600" />
                    Operator Connection: {selectedTicket.id}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">Category: {selectedTicket.category.toUpperCase()} • Status: {selectedTicket.status.toUpperCase()}</p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span>Operations Desk Online</span>
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4" id="chat-messages-viewport">
                
                {/* Initial Query Card */}
                <div className="flex items-start space-x-3 max-w-lg">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">AR</div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl">
                    <p className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-wider">Original Inquiry</p>
                    <p className="text-xs text-slate-700 mt-1">{selectedTicket.message}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1.5">{new Date(selectedTicket.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Reply Threads */}
                {selectedTicket.replies?.map((rep) => {
                  const isOperator = rep.sender === 'support';
                  return (
                    <div 
                      key={rep.id} 
                      id={`msg-bubble-${rep.id}`}
                      className={`flex items-start space-x-3 ${isOperator ? 'justify-start' : 'justify-end'}`}
                    >
                      {isOperator && (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs shrink-0 font-bold text-indigo-400">🌐</div>
                      )}
                      
                      <div className={`p-3.5 rounded-xl max-w-md ${
                        isOperator 
                          ? 'bg-slate-50 border border-slate-200 text-slate-700' 
                          : 'bg-indigo-50 border border-indigo-100 text-slate-800'
                      }`}>
                      <p className={`text-[9px] font-bold tracking-wider mb-1 uppercase ${
                        isOperator ? 'text-slate-400' : 'text-indigo-600'
                      }`}>
                        {isOperator ? 'OPERATIONS DESK' : 'AHMAD RAZA'}
                      </p>
                        <p className="text-xs leading-relaxed">{rep.message}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1.5">{new Date(rep.createdAt).toLocaleTimeString()}</p>
                      </div>

                      {!isOperator && (
                        <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shrink-0">AR</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendReply} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3" id="form-chat-send">
                <input
                  type="text"
                  required
                  id="chat-reply-input"
                  placeholder="Type your message to operations..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  id="btn-chat-send"
                  disabled={sendingReply}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-[540px] shadow-xs" id="chat-desk-empty">
              <MessageSquare className="w-12 h-12 text-slate-400 mb-4" />
              <h4 className="font-bold text-[#0F172A] uppercase tracking-tight">Select Coordinates To Initiate</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">Select one of your support coordinate tickets on the left sidebar to communicate directly with our regional desks.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
