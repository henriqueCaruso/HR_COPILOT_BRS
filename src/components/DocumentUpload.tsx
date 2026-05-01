import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Folder, ChevronRight, ChevronDown, Loader2, FileUp } from 'lucide-react';
import { uploadDocument } from '../lib/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

const CATEGORIES = ["Políticas", "Manuais", "Templates", "Outros"];

interface DocumentMeta {
  id: string;
  name: string;
  fileUri: string;
  mimeType: string;
  category: string;
}

interface DocumentUploadProps {
  onFolderSelected: (folder: string | null, docs: Array<{uri: string, mimeType: string, name: string}>) => void;
  activeFolder?: string | null;
}

export default function DocumentUpload({ onFolderSelected, activeFolder }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({"Políticas": true});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: DocumentMeta[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        docs.push({
          id: docSnap.id,
          name: data.name,
          fileUri: data.fileUri,
          mimeType: data.mimeType,
          category: data.category || 'Outros'
        });
      });
      setDocuments(docs);
    });
    return () => unsubscribe();
  }, [user]);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setSuccessMsg('');
    try {
      let mimeType = file.type;
      if (!mimeType) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'md') mimeType = 'text/markdown';
        else if (ext === 'csv') mimeType = 'text/csv';
        else if (ext === 'pdf') mimeType = 'application/pdf';
        else mimeType = 'text/plain';
      }

      // 1. Upload to Gemini 
      const uploadedInfo = await uploadDocument(file, mimeType);
      
      // 2. Save metadata to Firestore (for history/reference)
      await addDoc(collection(db, 'documents'), {
        userId: user?.uid,
        name: file.name,
        fileUri: uploadedInfo.uri,
        mimeType: mimeType,
        category: selectedCategory,
        createdAt: serverTimestamp(),
      });

      setSuccessMsg(`O arquivo '${file.name}' está pronto.`);
      
      // Expand the folder where it was uploaded
      setExpandedFolders(prev => ({...prev, [selectedCategory]: true}));
      
    } catch (err) {
      console.error(err);
      alert('Falha ao enviar documento.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const toggleFolder = (category: string) => {
    setExpandedFolders(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const docsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = documents.filter(d => d.category === cat);
    return acc;
  }, {} as Record<string, DocumentMeta[]>);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Upload Zone */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          Adicionar novo contexto
        </label>
        <div className="mb-3 flex items-center gap-2">
           <select 
             value={selectedCategory}
             onChange={e => setSelectedCategory(e.target.value)}
             className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 flex-1 outline-none focus:border-indigo-500"
             title="Selecione a pasta"
           >
             {CATEGORIES.map(c => (
               <option key={crypto.randomUUID()} value={c}>Pasta: {c}</option>
             ))}
           </select>
        </div>
        <div 
          className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <input 
            type="file" 
            id="fileUpload" 
            className="hidden" 
            accept=".txt,.md,.pdf,.csv"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center text-indigo-600">
              <Loader2 className="animate-spin w-6 h-6 mb-2" />
              <p className="text-xs font-medium">Processando documento...</p>
            </div>
          ) : successMsg ? (
            <div className="flex flex-col items-center text-emerald-600">
              <CheckCircle2 size={24} className="mb-1" />
              <p className="text-xs font-medium">{successMsg}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <FileUp size={24} className="text-indigo-400 mb-2" />
              <p className="text-xs font-medium text-slate-700">Clique ou arraste um PDF/TXT</p>
            </div>
          )}
        </div>
      </div>

      {/* Directory / Virtual Folders */}
      <div className="flex flex-col gap-1">
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          Biblioteca de Contexto
        </label>
        {CATEGORIES.map(category => {
          const catDocs = docsByCategory[category] || [];
          const isExpanded = expandedFolders[category];
          const isActiveFolder = activeFolder === category;
          
          return (
            <div key={crypto.randomUUID()} className="mb-1">
              <div 
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-slate-700 ${isActiveFolder ? 'bg-indigo-100' : 'hover:bg-slate-200'}`}
                onClick={() => {
                  if (isActiveFolder) {
                    onFolderSelected(null, []);
                  } else {
                    onFolderSelected(category, catDocs.map(d => ({ uri: d.fileUri, mimeType: d.mimeType, name: d.name })));
                  }
                }}
              >
                <div onClick={(e) => { e.stopPropagation(); toggleFolder(category); }}>
                  {isExpanded ? <ChevronDown size={14} className="text-slate-400 hover:text-slate-700" /> : <ChevronRight size={14} className="text-slate-400 hover:text-slate-700" />}
                </div>
                <Folder size={16} className={`fill-indigo-100 ${isActiveFolder ? 'text-indigo-700' : 'text-indigo-500'}`} />
                <span className={`text-sm ${isActiveFolder ? 'font-bold text-indigo-800' : 'font-medium'}`}>{category}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${isActiveFolder ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{catDocs.length}</span>
                {isActiveFolder && <CheckCircle2 size={14} className="text-indigo-600 shrink-0 ml-1" />}
              </div>
              
              {isExpanded && catDocs.length > 0 && (
                <div className="pl-6 pr-2 mt-1 flex flex-col gap-0.5">
                  {catDocs.map(doc => {
                    return (
                      <div 
                        key={doc.id || crypto.randomUUID()}
                        className="flex items-center gap-2 p-2 rounded-lg text-sm transition-all hover:bg-slate-100 text-slate-600"
                      >
                        <FileText size={14} className="text-slate-400" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
