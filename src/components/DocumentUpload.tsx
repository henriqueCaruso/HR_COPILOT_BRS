import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { uploadDocument } from '../lib/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

interface DocumentUploadProps {
  onDocumentSelected: (doc: { uri: string; mimeType: string; name: string }) => void;
}

export default function DocumentUpload({ onDocumentSelected }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { user } = useAuth();

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setSuccessMsg('');
    try {
      // 1. Upload to Gemini 
      const uploadedInfo = await uploadDocument(file);
      
      // 2. Save metadata to Firestore (for history/reference)
      await addDoc(collection(db, 'documents'), {
        userId: user?.uid,
        name: file.name,
        fileUri: uploadedInfo.uri,
        mimeType: file.type,
        createdAt: serverTimestamp(),
      });

      setSuccessMsg(`O arquivo '${file.name}' está pronto para ser usado como contexto.`);
      onDocumentSelected({
        uri: uploadedInfo.uri,
        mimeType: file.type,
        name: file.name
      });
    } catch (err) {
      console.error(err);
      alert('Falha ao enviar documento.');
    } finally {
      setIsUploading(false);
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

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
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
          <div className="flex flex-col items-center text-blue-600">
            <div className="w-8 h-8 relative mb-3">
              <div className="w-8 h-8 rounded-full border-4 border-blue-200"></div>
              <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-sm font-medium">Processando documento...</p>
          </div>
        ) : successMsg ? (
          <div className="flex flex-col items-center text-emerald-600">
            <CheckCircle2 size={32} className="mb-2" />
            <p className="text-sm font-medium">{successMsg}</p>
            <p className="text-xs text-emerald-500 mt-1">Clique ou arraste outro para substituir</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-3">
              <UploadCloud size={24} className="text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">Faça upload de base de conhecimento</p>
            <p className="text-xs text-slate-400 mt-1">Clique ou arraste um PDF ou texto (Max 20MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
