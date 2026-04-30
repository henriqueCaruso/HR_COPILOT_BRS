import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Send, Bot, User, FileText, Loader2 } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { generateChatResponse } from '../lib/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, where, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'ai', text: 'Olá! Sou seu Copiloto de RH. Pergunte-me sobre políticas da empresa ou peça para redigir um comunicado, como "Escreva um email de convite para a festa de fim de ano".' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{uri: string, mimeType: string, name: string} | null>(null);
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
           // We store prompt and response in a single doc for simplicity. We can render them.
           history.push({ id: docSnap.id + '-usr', role: 'user', text: data.prompt });
           history.push({ id: docSnap.id + '-ai', role: 'ai', text: data.response });
        }
      });
      if (history.length > 0) {
        setMessages([
          { id: 'initial', role: 'ai', text: 'Histórico carregado. Como posso ajudar com RH hoje?' },
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userPrompt }]);
    setIsLoading(true);

    try {
      const aiResponse = await generateChatResponse(userPrompt, activeDoc?.uri, activeDoc?.mimeType);
      
      // Save to history
      await addDoc(collection(db, 'chats'), {
        userId: user?.uid,
        prompt: userPrompt,
        response: aiResponse,
        createdAt: serverTimestamp()
      });

      // Local state is updated via snapshot
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'err', role: 'ai', text: 'Ocorreu um erro ao gerar a resposta. Verifique a chave de API.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col items-center">
        <div className="p-6 border-b border-slate-200 w-full">
          <h2 className="text-xl font-bold text-slate-800">HR Copilot BRS</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Painel de Contexto</p>
        </div>

        <div className="flex-1 p-6 w-full flex flex-col gap-6 overflow-y-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            Arraste um manual (PDF/TXT) para basear as respostas do modelo. Ex: "Manual de Benefícios 2024.pdf"
          </div>
          <DocumentUpload onDocumentSelected={setActiveDoc} />

          {activeDoc && (
            <div className="bg-white border shadow-sm rounded-xl p-3 flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 truncate w-40" title={activeDoc.name}>{activeDoc.name}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Ativo e carregado</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
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
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot size={20} />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl p-5 ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{m.text}</p>
                </div>

                {m.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center shrink-0 shadow-sm mt-1 overflow-hidden">
                     {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <User size={20} />}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot size={20} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm flex items-center gap-2 text-slate-500">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  <span className="text-sm font-medium">Buscando documentos e redigindo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-200 w-full relative">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
            <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Exemplo: 'Escreva as diretrizes para trabalho remoto'..."
                className="w-full bg-transparent py-4 pl-5 pr-14 outline-none text-slate-800 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                title="Enviar"
              >
                 <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-3">
              <p className="text-xs text-slate-400">Todo conteúdo gerado pode conter vieses. Verifique antes de aprovar.</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
