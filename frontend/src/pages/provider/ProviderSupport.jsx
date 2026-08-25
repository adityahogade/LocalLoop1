import React, { useState, useEffect, useRef } from 'react';
import { customerApi } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import { FiMessageSquare, FiSend, FiPlus, FiX } from 'react-icons/fi';

export default function ProviderSupport() {
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active ticket details
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Create Ticket Form
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('kyc');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getTickets();
      if (res?.success) {
        setTickets(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const loadTicketMessages = async (ticket) => {
    setActiveTicket(ticket);
    setLoadingMessages(true);
    try {
      const res = await customerApi.getTicket(ticket.id);
      if (res?.success && res.data) {
        setMessages(res.data.messages || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;

    try {
      const res = await customerApi.sendTicketMessage(activeTicket.id, newMessage);
      if (res?.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setNewMessage('');
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    }
  };

  const handleCloseTicket = async (id) => {
    if (!window.confirm('Mark this support ticket as resolved?')) return;
    try {
      const res = await customerApi.closeTicket(id);
      if (res?.success) {
        alert('Ticket marked as resolved.');
        setActiveTicket(null);
        fetchTickets();
      }
    } catch (err) {
      alert(err.message || 'Failed to close ticket.');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !description) return;

    setSubmittingTicket(true);
    try {
      const res = await customerApi.createTicket({
        subject,
        category,
        priority,
        message: description,
      });

      if (res?.success) {
        alert('Support ticket submitted successfully!');
        setCreateModalOpen(false);
        setSubject('');
        setCategory('kyc');
        setPriority('medium');
        setDescription('');
        fetchTickets();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[calc(100vh-12rem)]">
      {/* Sidebar - Tickets List */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-md font-bold text-gray-800">Support Threads</h3>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            New
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 max-h-[500px]">
          {tickets.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No support tickets found.</p>
          ) : (
            tickets.map((item) => (
              <div
                key={item.id}
                onClick={() => loadTicketMessages(item)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  activeTicket?.id === item.id
                    ? 'border-blue-600 bg-blue-50/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1 text-[10px]">
                  <span className="font-mono text-gray-400">{item.ticket_code}</span>
                  <StatusBadge status={item.status} />
                </div>
                <h4 className="text-xs font-bold text-gray-800 truncate">{item.subject}</h4>
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-medium">
                  <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    {item.category}
                  </span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Panel - Messages Thread */}
      <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full min-h-[500px]">
        {activeTicket ? (
          <>
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800">{activeTicket.subject}</h3>
                  <StatusBadge status={activeTicket.status} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-mono font-semibold">
                  CODE: {activeTicket.ticket_code} | Priority: {activeTicket.priority}
                </p>
              </div>

              {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
                <button
                  onClick={() => handleCloseTicket(activeTicket.id)}
                  className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 px-3 py-1.5 rounded text-xs font-bold"
                >
                  Mark Resolved
                </button>
              )}
            </div>

            <div className="flex-grow p-6 overflow-y-auto max-h-[350px] space-y-4">
              {loadingMessages ? (
                <Skeleton count={3} />
              ) : (
                messages.map((msg, index) => {
                  const isMe = String(msg.sender_id) === String(user?.id);
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl p-4 text-xs font-semibold leading-normal shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                        <p>{msg.message}</p>
                        <span className={`block text-[9px] text-right mt-1.5 font-medium ${
                          isMe ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' ? (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Type your reply message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow border rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg flex items-center justify-center shadow-md transition-all shrink-0"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
                This support ticket thread is closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-center p-8">
            <div>
              <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-md font-bold text-gray-700 mb-1">Select a Support Thread</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Choose a thread from the list on the left to review support logs or message system admin staff.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Submit New Support Inquiry</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KYC verification delay, settlement issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  >
                    <option value="kyc">KYC verification</option>
                    <option value="payment">Payout Settling</option>
                    <option value="subscription">Subscriptions</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Explain the inquiry details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
