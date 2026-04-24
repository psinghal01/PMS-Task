import React, { useState, useEffect, useRef } from 'react';
import { getPatients, getDepartments, getBriefing, getHistory } from './api';
import type { Patient, Department, Briefing, Consultation } from './types';
import { User, Activity, MessageSquare, History, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeTab, setActiveTab] = useState<'briefing' | 'chat' | 'history'>('briefing');
  
  const [chatMessage, setChatMessage] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRawRecords, setShowRawRecords] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPatients().then(res => setPatients(res.data));
    getDepartments().then(res => setDepartments(res.data));
  }, []);

  const handleGenerateBriefing = async () => {
    if (!selectedPatient || !selectedDept) return;
    try {
      const res = await getBriefing(selectedPatient, selectedDept);
      setBriefing(res.data);
      setActiveTab('briefing');
      // Also fetch history
      const historyRes = await getHistory(selectedPatient, selectedDept);
      setConsultations(historyRes.data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate briefing. Ensure backend is running and Supabase is seeded.");
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage || !selectedPatient || !selectedDept || isStreaming) return;
    
    setIsStreaming(true);
    setStreamingResponse('');
    setActiveTab('chat');

    setChatMessage('');

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/consult/stream?patient_id=${selectedPatient}&department_id=${selectedDept}&doctor_message=${encodeURIComponent(chatMessage)}&model=huggingface`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStreamingResponse(prev => prev + data.data);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
      // Refresh history after stream
      getHistory(selectedPatient, selectedDept).then(res => setConsultations(res.data));
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ClinicalAssistant <span className="text-primary text-xs font-medium ml-1">v1.0</span></h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <select 
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">Select Patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          
          <select 
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <button 
            onClick={handleGenerateBriefing}
            disabled={!selectedPatient || !selectedDept}
            className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Generate Briefing
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border flex flex-col p-4 gap-2 bg-surface/30">
          <NavButton active={activeTab === 'briefing'} onClick={() => setActiveTab('briefing')} icon={<User size={18}/>} label="Patient Briefing" />
          <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={18}/>} label="AI Consultation" />
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18}/>} label="Consultation History" />
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col relative overflow-hidden">
          {!briefing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <Activity size={48} className="opacity-20" />
              <p>Select a patient and department to start</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-8" ref={scrollRef}>
              {activeTab === 'briefing' && (
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl font-bold">Patient Briefing</h2>
                    <button 
                      onClick={() => setShowRawRecords(!showRawRecords)}
                      className="text-xs text-primary hover:underline"
                    >
                      {showRawRecords ? 'Hide' : 'Show'} Raw Records ({briefing.raw_records.length})
                    </button>
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-6 shadow-xl whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
                    {briefing.briefing_text}
                  </div>

                  {showRawRecords && (
                    <div className="mt-8 space-y-4">
                      <h3 className="text-lg font-semibold">Included Medical Records</h3>
                      <div className="grid gap-3">
                        {briefing.raw_records.map(record => (
                          <div key={record.id} className="bg-surface/50 border border-border p-4 rounded-lg flex justify-between items-center">
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <span className={cn(
                                  "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                  record.severity === 5 ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
                                )}>
                                  {record.record_type}
                                </span>
                                <span className="text-sm font-medium">{record.title}</span>
                              </div>
                              <p className="text-xs text-gray-400">{record.content}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-gray-500">Severity</div>
                              <div className="text-sm font-bold text-primary">{record.severity}/5</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                  <div className="flex-1 space-y-6 pb-24">
                    {consultations.length === 0 && !streamingResponse && (
                      <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl flex gap-4">
                        <AlertTriangle className="text-primary shrink-0" />
                        <div>
                          <h4 className="font-semibold text-primary mb-1">Clinical Context Loaded</h4>
                          <p className="text-sm text-gray-400">The AI has access to the full patient briefing. You can ask about history, medications, or potential interactions.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Render Chat Messages (Latest consultation or all) */}
                    <div className="flex flex-col gap-4">
                      {consultations.length > 0 && consultations[0].messages.map((m, i) => (
                        <div key={i} className={cn(
                          "p-4 rounded-xl max-w-[80%]",
                          m.role === 'doctor' ? "bg-surface border border-border self-end ml-auto" : "bg-primary/5 text-gray-200"
                        )}>
                          <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">{m.role}</div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                        </div>
                      ))}
                    </div>

                    {/* Streaming Response */}
                    {streamingResponse && (
                      <div className="bg-primary/5 p-4 rounded-xl max-w-[80%] animate-in fade-in duration-300">
                        <div className="text-[10px] uppercase font-bold text-primary mb-2">AI Assistant</div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{streamingResponse}</div>
                      </div>
                    )}
                  </div>

                  {/* Input Box */}
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
                    <div className="bg-surface border border-border rounded-2xl p-2 shadow-2xl flex gap-2 items-center">
                      <textarea 
                        rows={1}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Ask the clinical assistant..."
                        className="flex-1 bg-transparent border-none outline-none p-3 text-sm resize-none"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={isStreaming || !chatMessage}
                        className="bg-primary hover:bg-blue-600 disabled:opacity-50 p-2.5 rounded-xl transition-all"
                      >
                        {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  <h2 className="text-2xl font-bold mb-6">Past Consultations</h2>
                  {consultations.length === 0 ? (
                    <p className="text-gray-500 italic">No previous consultations found for this patient in this department.</p>
                  ) : (
                    consultations.map(consult => (
                      <div key={consult.id} className="bg-surface border border-border rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-bold text-primary">{consult.doctor_name}</span>
                          <span className="text-xs text-gray-500">{new Date(consult.created_at).toLocaleString()}</span>
                        </div>
                        <div className="space-y-4">
                          {consult.messages.map((m, i) => (
                            <div key={i} className="border-l-2 border-border pl-4">
                              <div className="text-[10px] uppercase font-bold text-gray-500">{m.role}</div>
                              <div className="text-sm">{m.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active ? "bg-primary/10 text-primary shadow-sm" : "text-gray-400 hover:bg-surface hover:text-gray-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
