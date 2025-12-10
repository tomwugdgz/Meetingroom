
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ROLES } from './constants';
import { Message, Role, MeetingSummary, ViewState } from './types';
import { generateRoleResponse, generateMeetingSummary } from './services/geminiService';
import OutcomePanel from './components/OutcomePanel';
import Avatar from './components/Avatar';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('setup');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['tom', 'steve']); // Default selection
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [showOutcomePanel, setShowOutcomePanel] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleStartMeeting = () => {
    if (selectedRoles.length === 0) return;
    setViewState('meeting');
    // Add welcome message
    setMessages([{
      id: 'system-1',
      roleId: 'system',
      roleName: 'System',
      content: 'Meeting started. The attendees are reviewing the agenda. Please state your problem or topic.',
      timestamp: Date.now()
    }]);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getOrderedRolesForTurn = (input: string, currentSelected: string[]) => {
    // Regex to find @Name (supports English and roughly matches Chinese/Unicode names)
    const mentionMatch = input.match(/@([a-zA-Z0-9_\u4e00-\u9fa5]+)/);
    
    if (mentionMatch) {
        const mentionedName = mentionMatch[1].toLowerCase();
        // Find the role in the global list to get the ID
        const matchedRole = ROLES.find(r => 
            r.name.toLowerCase().includes(mentionedName) || 
            r.id.toLowerCase() === mentionedName
        );

        // If the mentioned role is currently selected for the meeting
        if (matchedRole && currentSelected.includes(matchedRole.id)) {
            // Reorder: Mentioned role first, then the others
            const others = currentSelected.filter(id => id !== matchedRole.id);
            return [matchedRole.id, ...others];
        }
    }
    return currentSelected;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    setUserInput('');
    
    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      roleId: 'user',
      roleName: 'You',
      content: currentInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Orchestrate responses from selected roles
    // Logic: If user mentions @Name, that role goes first.
    
    const rolesToRespond = getOrderedRolesForTurn(currentInput, selectedRoles);
    
    // We create a copy of history including the new user message
    let currentHistory = [...messages, userMsg];

    try {
        for (const roleId of rolesToRespond) {
            const role = ROLES.find(r => r.id === roleId);
            if (!role) continue;

            // Small delay for realism
            await new Promise(resolve => setTimeout(resolve, 800));

            const responseText = await generateRoleResponse(role, currentHistory, currentInput);
            
            const roleMsg: Message = {
                id: Date.now() + Math.random().toString(),
                roleId: role.id,
                roleName: role.name,
                content: responseText,
                timestamp: Date.now()
            };

            setMessages(prev => {
                const updated = [...prev, roleMsg];
                currentHistory = updated; // Update local history for next iteration if dependent
                return updated;
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsTyping(false);
    }
  };

  const handleEndMeeting = async () => {
    setIsSummaryLoading(true);
    setShowOutcomePanel(true);
    const result = await generateMeetingSummary(messages.filter(m => m.roleId !== 'system'));
    setSummary(result);
    setIsSummaryLoading(false);
  };

  if (viewState === 'setup') {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-brand-blue p-8 text-white flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4">Brainstorming<br/>Meeting</h1>
              <p className="text-blue-100 opacity-90 mb-6">
                Assemble your dream team of visionaries and experts to solve your toughest business challenges.
              </p>
              <div className="flex -space-x-2 overflow-hidden mb-6">
                 {ROLES.slice(0, 4).map(r => (
                     <img key={r.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover" src={r.avatar} alt={r.name} />
                 ))}
                 <span className="h-10 w-10 rounded-full ring-2 ring-white bg-white/20 flex items-center justify-center text-xs">+2</span>
              </div>
            </div>
            <div className="text-sm opacity-70">
              Powered by Gemini 2.5 Flash
            </div>
          </div>
          
          <div className="md:w-2/3 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Attendees</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {ROLES.map(role => (
                <div 
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    selectedRoles.includes(role.id) 
                      ? 'border-brand-orange bg-orange-50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Avatar role={role} size="md" showBadge={true} />
                  <div>
                    <h3 className="font-bold text-gray-800">{role.name}</h3>
                    <p className="text-xs text-gray-500 truncate w-32">{role.title}</p>
                  </div>
                  {selectedRoles.includes(role.id) && (
                    <div className="ml-auto text-brand-orange">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={handleStartMeeting}
              disabled={selectedRoles.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
                selectedRoles.length > 0 
                  ? 'bg-brand-blue text-white hover:bg-blue-800 shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Session ({selectedRoles.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden relative">
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-20 bg-brand-blue items-center py-6 space-y-6 z-20">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold text-xl cursor-pointer" onClick={() => setViewState('setup')}>
           B
        </div>
        <div className="flex-1 w-full flex flex-col items-center space-y-4 overflow-y-auto scrollbar-hide">
            {selectedRoles.map(id => {
                const r = ROLES.find(role => role.id === id);
                if(!r) return null;
                return (
                    <div key={id} className="cursor-pointer hover:opacity-80 transition" title={r.name}>
                        <Avatar role={r} size="sm" showBadge />
                    </div>
                )
            })}
        </div>
        <button 
            onClick={() => handleEndMeeting()}
            className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white hover:bg-red-600 transition shadow-lg mb-4" 
            title="End Meeting & Get Minutes"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-3">
                 <button onClick={() => setViewState('setup')} className="md:hidden text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                 </button>
                 <h1 className="text-lg font-bold text-gray-800">Boardroom Discussion</h1>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => handleEndMeeting()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition border border-red-200"
                 >
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    End Meeting
                 </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={chatContainerRef}>
             {messages.map((msg) => {
                 const isUser = msg.roleId === 'user';
                 const isSystem = msg.roleId === 'system';
                 const role = ROLES.find(r => r.id === msg.roleId);

                 if (isSystem) {
                     return (
                         <div key={msg.id} className="flex justify-center">
                             <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{msg.content}</span>
                         </div>
                     )
                 }

                 return (
                     <div key={msg.id} className={`flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                         <div className="mt-1">
                             {role ? <Avatar role={role} /> : <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white">U</div>}
                         </div>
                         <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                             <span className="text-xs text-gray-400 mb-1 block">{msg.roleName}</span>
                             <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                                 isUser 
                                 ? 'bg-brand-blue text-white rounded-tr-none' 
                                 : role?.id === 'tom' 
                                    ? 'bg-orange-50 border border-orange-100 text-gray-800 rounded-tl-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                             }`}>
                                 {msg.content}
                             </div>
                         </div>
                     </div>
                 )
             })}
             {isTyping && (
                 <div className="flex gap-4 max-w-3xl">
                     <div className="w-10 h-10 flex items-center justify-center">...</div>
                     <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 text-gray-400 text-sm">
                         Thinking...
                     </div>
                 </div>
             )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto relative">
                <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Type @Name to address someone first, or just type to speak to everyone..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pr-14 focus:ring-2 focus:ring-brand-blue focus:outline-none resize-none h-24 shadow-inner"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isTyping}
                    className="absolute right-3 bottom-3 p-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="text-center mt-2 text-xs text-gray-400">
                AI may produce inaccurate information.
            </div>
        </div>
      </div>

      {/* Outcome Drawer (Right Side) */}
      <div className={`fixed inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${showOutcomePanel ? 'translate-x-0' : 'translate-x-full'}`}>
          <OutcomePanel 
            summary={summary} 
            isLoading={isSummaryLoading} 
            onGenerate={handleEndMeeting}
            onClose={() => setShowOutcomePanel(false)}
          />
      </div>
      
      {/* Overlay for mobile drawer */}
      {showOutcomePanel && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setShowOutcomePanel(false)}
          />
      )}

    </div>
  );
};

export default App;
