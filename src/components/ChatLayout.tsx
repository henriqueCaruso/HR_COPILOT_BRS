import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Send, Bot, User, FileText, Loader2, Sparkles, MessageSquare, Mail, BrainCircuit } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { generateChatResponse } from '../lib/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, where, serverTimestamp } from 'firebase/firestore';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const MODELS = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Avançado)' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Rápido)' },
  { id: 'gemini-3-flash-lite', name: 'Gemini 3 Flash-Lite (Econômico)' }
];

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'ai', text: 'Olá! Sou RHIÁ, sua assistente da UniFECAF. Como posso ajudar com demandas acadêmicas e de gestão de pessoas hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{uri: string, mimeType: string, name: string} | null>(null);
  const [activeModel, setActiveModel] = useState(MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history: Message[] = [];
      snapshot.docs.reverse().forEach(docSnap => {
        const data = docSnap.data();
        if (data.userId === user.uid) {
           history.push({ id: docSnap.id + '-usr', role: 'user', text: data.prompt });
           history.push({ id: docSnap.id + '-ai', role: 'ai', text: data.response });
        }
      });
      if (history.length > 0) {
        setMessages([
          { id: 'initial', role: 'ai', text: 'Histórico carregado. Em que posso ajudar hoje?' },
          ...history
        ]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const userPrompt = customPrompt || input.trim();
    if (!userPrompt || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userPrompt }]);
    setIsLoading(true);

    try {
      const aiResponse = await generateChatResponse(userPrompt, activeModel, activeDoc?.uri, activeDoc?.mimeType);
      
      // Save to history
      await addDoc(collection(db, 'chats'), {
        userId: user?.uid,
        prompt: userPrompt,
        response: aiResponse,
        model: activeModel,
        contextDocUri: activeDoc?.uri || null,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'err', role: 'ai', text: 'Ocorreu um erro ao gerar a resposta. Verifique a configuração ou sua conexão.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const insertQuickAction = (action: string) => {
    let prefix = '';
    if (action === 'email') prefix = 'Escreva uma resposta profissional para envio por e-mail: ';
    if (action === 'whats') prefix = 'Escreva uma resposta curta e amigável para envio via WhatsApp: ';
    if (action === 'pensamento') prefix = 'Analise profundamente este cenário e apresente prós, contras e uma recomendação: ';
    
    setInput(prefix);
    const inputEl = document.getElementById('chatInput');
    if (inputEl) inputEl.focus();
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col items-center">
        <div className="p-6 border-b border-slate-200 w-full bg-white shadow-sm z-10 relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
              RHIÁ UniFECAF
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">SISTEMA INTEGRADO DE RH</p>
        </div>

        <div className="w-full px-6 py-4 border-b border-slate-200">
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Modelo de Inteligência
          </label>
          <select 
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all"
          >
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="flex-1 p-6 w-full flex flex-col gap-6 overflow-y-auto">
          <DocumentUpload 
            onDocumentSelected={setActiveDoc} 
            activeDocUri={activeDoc?.uri} 
          />

          {activeDoc && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 truncate w-40" title={activeDoc.name}>{activeDoc.name}</p>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">Contexto Ativo</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 w-full bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shadow-inner">
              {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-700 truncate w-32">{user?.displayName || 'RH Parceiro'}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-white relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md mt-1">
                    <Sparkles size={20} />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl p-5 ${
                  m.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-sm shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  {m.role === 'ai' ? (
                     <div className="prose prose-sm md:prose-base prose-slate max-w-none">
                       <Markdown>{m.text}</Markdown>
                     </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">{m.text}</p>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-sm mt-1 overflow-hidden">
                     {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <User size={20} />}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md mt-1">
                  <Sparkles size={20} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm flex items-center gap-3 text-slate-500">
                  <Loader2 size={18} className="animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Analisando e redigindo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200 w-full">
          <div className="max-w-3xl mx-auto">
            {/* Quick Actions */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              <button 
                onClick={() => insertQuickAction('email')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs font-semibold rounded-full transition-colors whitespace-nowrap border border-slate-200 hover:border-indigo-200"
              >
                <Mail size={14} />
                Resposta para E-mail
              </button>
              <button 
                onClick={() => insertQuickAction('whats')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold rounded-full transition-colors whitespace-nowrap border border-slate-200 hover:border-emerald-200"
              >
                <MessageSquare size={14} />
                Resposta para Whats
              </button>
              <button 
                onClick={() => insertQuickAction('pensamento')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 text-xs font-semibold rounded-full transition-colors whitespace-nowrap border border-slate-200 hover:border-purple-200"
              >
                <BrainCircuit size={14} />
                Pensamento Profundo
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative flex flex-col bg-white border border-slate-300 rounded-2xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
                <textarea 
                  id="chatInput"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Exemplo: 'Reescreva a política de home office...' (Use Shift+Enter para nova linha)"
                  className="w-full bg-transparent p-4 outline-none text-slate-800 placeholder:text-slate-400 min-h-[60px] max-h-32 resize-y"
                  disabled={isLoading}
                  rows={2}
                />
                <div className="flex justify-between items-center p-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                  <div className="text-xs text-slate-400 font-medium px-2">
                    {activeDoc ? `Contexto: ${activeDoc.name}` : 'Sem documento de contexto'}
                  </div>
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                    title="Enviar"
                  >
                     <Send size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
