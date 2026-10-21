import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/admin';
import { customerApi } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import { FiMessageSquare, FiSend, FiPlus, FiX } from 'react-icons/fi';

export default function AdminSupport() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active support thread details
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getTickets(); // listings return all for Admin
      if (res?.success) {
        setTickets(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform support tickets.');
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

  const handleResolveTicket = async (id) => {
    if (!window.confirm('Close this support ticket as resolved?')) return;
    try {
      const res = await customerApi.closeTicket(id);
      if (res?.success) {
        alert('Ticket resolved and closed.');
        setActiveTicket(null);
        fetchTickets();
      }
    } catch (err) {
      alert(err.message || 'Failed to resolve ticket.');
    }
  };

  if (loading && tickets.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-h-[calc(100vh-12rem)] text-left">
      {/* Sidebar - Tickets List */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col h-full min-w-0">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-800">Support Inquiries</h3>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 max-h-[300px] md:max-h-[500px]">
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
      <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full min-h-[400px] sm:min-h-[500px] min-w-0">
        {activeTicket ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 truncate">{activeTicket.subject}</h3>
                  <StatusBadge status={activeTicket.status} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 sm:mt-1 font-mono font-semibold truncate">
                  CODE: {activeTicket.ticket_code} | Priority: {activeTicket.priority} | User ID: {activeTicket.user_id}
                </p>
              </div>

              {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
                <button
                  onClick={() => handleResolveTicket(activeTicket.id)}
                  className="bg-green-600 hover:bg-green-750 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm self-start sm:self-auto shrink-0"
                >
                  Mark Resolved
                </button>
              )}
            </div>

            <div className="flex-grow p-4 sm:p-6 overflow-y-auto max-h-[350px] space-y-4">
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
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 text-xs font-semibold leading-normal shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                        <p className="break-words">{msg.message}</p>
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
                  placeholder="Type reply message on behalf of Admin support..."
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
                This support ticket thread is closed and resolved.
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-center p-8">
            <div>
              <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-md font-bold text-gray-700 mb-1">Select Support ticket</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Click on a customer or provider ticket thread to view messages logs and send responses.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
