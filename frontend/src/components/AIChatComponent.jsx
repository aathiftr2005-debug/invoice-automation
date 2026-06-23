import React, { useReducer, useRef, useEffect } from 'react';
import { Send, Bot, User, Camera, Calendar, CheckCircle2, DollarSign, Layers, Loader2, RefreshCw } from 'lucide-react';

// 1. Unified Master Reducer States
const initialState = {
  messages: [
    { id: 1, role: 'assistant', content: "Welcome to aathifproject2026. Describe an invoice like 'Bill John €1200/month, VAT 19%' or scan a receipt — I'll build a unified draft you can mark as recurring." }
  ],
  chatStatus: 'Ready', // Ready, Processing, Parsed, Error
  ocrStage: 'idle',    // idle, uploading, ocr, extracting, done
  unifiedDraft: {
    client: '—',
    description: '—',
    subtotal: '—',
    tax: '—',
    total: '—',
    frequency: 'One-time'
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, chatStatus: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_STREAM_TEXT':
      const updatedMessages = [...state.messages];
      updatedMessages[updatedMessages.length - 1].content = action.payload;
      return { ...state, messages: updatedMessages };
    case 'START_OCR':
      return { ...state, ocrStage: 'uploading', chatStatus: 'Processing' };
    case 'SET_OCR_STAGE':
      return { ...state, ocrStage: action.payload };
    case 'SYNC_DRAFT':
      return { 
        ...state, 
        unifiedDraft: { ...state.unifiedDraft, ...action.payload },
        chatStatus: 'Parsed'
      };
    case 'SET_FREQUENCY':
      return {
        ...state,
        unifiedDraft: { ...state.unifiedDraft, frequency: action.payload }
      };
    case 'RESET_ALL':
      return initialState;
    default:
      return state;
  }
}

export default function AIChatComponent() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = React.useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Asynchronous Fetch Handler to Flask Ingestion Backend Pipeline
  const handleCommitToLedger = async () => {
    dispatch({ type: 'SET_STATUS', payload: 'Processing' });
    
    try {
          // ✅ Perfect Fixed Execution Line:
const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/invoice/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state.unifiedDraft),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`🎉 Draft Committed to Ledger Successfully!\nMessage: ${result.message}`);
        dispatch({ type: 'SET_STATUS', payload: 'Parsed' });
      } else {
        alert(`⚠️ Pipeline Ingestion Error: ${result.message}`);
        dispatch({ type: 'SET_STATUS', payload: 'Ready' });
      }
    } catch (error) {
      alert(`❌ Network Failure Matrix Breakdown!\nMessage: ${error.message}\nStack Trace: ${error.stack}`);
      dispatch({ type: 'SET_STATUS', payload: 'Ready' });
    }
  };

  // Auto scroll logic for chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.ocrStage]);

  // 2. Prompt Text Streaming Simulation Handler
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    dispatch({ type: 'ADD_MESSAGE', payload: { id: Date.now(), role: 'user', content: userQuery } });
    setInput('');
    dispatch({ type: 'SET_STATUS', payload: 'Processing' });

    setTimeout(() => {
      let mockTargetDraft = {};
      let streamTextChunks = "";

      if (userQuery.toLowerCase().includes('acme')) {
        mockTargetDraft = {
          client: 'Acme Corp',
          description: 'web design',
          subtotal: '$1,200.00',
          tax: '$120.00 (10%)',
          total: '$1,320.00'
        };
        streamTextChunks = "Parsing your request · Identified client & amount · Mapped VAT at 10% · Single invoice draft ready · Summary card attached below.";
      } else if (userQuery.toLowerCase().includes('john')) {
        mockTargetDraft = {
          client: 'John',
          description: '3 months web design services',
          subtotal: '€1,200.00',
          tax: '€228.00 (19%)',
          total: '€1,428.00'
        };
        streamTextChunks = "Parsing your request · Target client 'John' isolated · Derived billing volume at €1200/month · Consolidated 19% VAT parameters into unified panel sheet.";
      } else {
        mockTargetDraft = {
          client: 'Custom Client',
          description: userQuery,
          subtotal: '$1,000.00',
          tax: '$0.00 (0%)',
          total: '$1,000.00'
        };
        streamTextChunks = "Parsing custom string expressions · Structural payload context matched default schemas successfully.";
      }

      const assistantMsgId = Date.now() + 1;
      dispatch({ type: 'ADD_MESSAGE', payload: { id: assistantMsgId, role: 'assistant', content: '', hasCard: true, cardData: mockTargetDraft } });

      let currentIdx = 0;
      const streamInterval = setInterval(() => {
        if (currentIdx < streamTextChunks.length) {
          dispatch({ type: 'UPDATE_STREAM_TEXT', payload: streamTextChunks.substring(0, currentIdx + 1) });
          currentIdx += 3; 
        } else {
          clearInterval(streamInterval);
          dispatch({ type: 'SYNC_DRAFT', payload: mockTargetDraft });
        }
      }, 15);

    }, 600);
  };

  // 3. Multi-Stage Vision Pipeline Simulator
  const handleOcrInference = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    dispatch({ type: 'START_OCR' });
    dispatch({ type: 'ADD_MESSAGE', payload: { id: Date.now(), role: 'user', content: `📸 [Image Upload Triggered]: ${e.target.files[0].name}` } });

    // Stage 1: Uploading
    setTimeout(() => {
      dispatch({ type: 'SET_OCR_STAGE', payload: 'ocr' });
      
      // Stage 2: OCR Reading
      setTimeout(() => {
        dispatch({ type: 'SET_OCR_STAGE', payload: 'extracting' });
        
        // Stage 3: Entity Extracting
        setTimeout(() => {
          const ocrExtractedPayload = {
            client: 'Mock Vendor Corp',
            description: 'OCR Scanned Receipt Paperwork',
            subtotal: '₹4,500.00',
            tax: '₹810.00 (18% GST)',
            total: '₹5,310.00'
          };
          dispatch({ type: 'SET_OCR_STAGE', payload: 'done' });
          dispatch({ type: 'SYNC_DRAFT', payload: ocrExtractedPayload });
          dispatch({ type: 'ADD_MESSAGE', payload: { 
            id: Date.now() + 2, 
            role: 'assistant', 
            content: "Receipt parsed successfully. Core billing coordinates populated directly inside your master layout workspace summary ledger below.",
            hasCard: true,
            cardData: ocrExtractedPayload
          }});
        }, 1000);
      }, 900);
    }, 700);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-zinc-950 min-h-screen text-zinc-100 font-inter antialiased">
      
      {/* Workspace Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white font-inter">aathifproject2026</h1>
            <span className="bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-medium px-2 py-0.5 rounded text-mangoGold uppercase tracking-widest">Workspace v1.4</span>
          </div>
          <p className="text-zinc-400 text-sm mt-1 font-inter">AI Invoice Assistant — Unified chat, receipt OCR, and recurring billing pipelines.</p>
        </div>
        
        {/* Real-time Stage Status Bar */}
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-xl font-inter">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status:</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 transition-all ${
            state.chatStatus === 'Parsed' ? 'bg-mangoGold/10 border border-mangoGold/30 text-mangoGold' :
            state.chatStatus === 'Processing' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${state.chatStatus === 'Parsed' ? 'bg-mangoGold' : state.chatStatus === 'Processing' ? 'bg-blue-400 animate-ping' : 'bg-zinc-500'}`}></span>
            {state.chatStatus}
          </span>
          <button onClick={() => dispatch({ type: 'RESET_ALL' })} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition" title="Reset Layout">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-inter">
        
        {/* Left Column blocks: Chat and OCR Scanner */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* FEATURE 1: AI Chat Interface */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-mangoGlow overflow-hidden flex flex-col h-[520px]">
            <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-mangoGold" /> Natural Language Billing
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Try: Bill John €1200/month, VAT 19%</span>
            </div>

            {/* Chat History Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {state.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-zinc-800 border-zinc-700' : 'bg-mangoGold/10 border-mangoGold/20'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-300" /> : <Bot className="w-4 h-4 text-mangoGold" />}
                  </div>
                  
                  <div className="space-y-3 w-full">
                    <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user' ? 'bg-mangoGold text-zinc-950 font-semibold rounded-tr-none ml-auto table' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>

                    {/* Inline Parsing Target Summary Cards */}
                    {msg.hasCard && msg.cardData && msg.cardData.client !== '—' && (
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 max-w-sm space-y-3 font-mono shadow-md border-l-2 border-l-mangoGold">
                        <div className="text-[11px] uppercase font-bold text-mangoGold tracking-wider flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                          <span>AI Parsed Draft Entry</span>
                          <span className="text-zinc-500">JSON-Schema</span>
                        </div>
                        <div className="grid grid-cols-3 gap-y-1 text-xs">
                          <span className="text-zinc-500">Client:</span> <span className="col-span-2 text-zinc-200 font-semibold">{msg.cardData.client}</span>
                          <span className="text-zinc-500">Desc:</span> <span className="col-span-2 text-zinc-400 truncate">{msg.cardData.description}</span>
                          <span className="text-zinc-500">Subtotal:</span> <span className="col-span-2 text-zinc-300">{msg.cardData.subtotal}</span>
                          <span className="text-zinc-500">Tax Rates:</span> <span className="col-span-2 text-zinc-400">{msg.cardData.tax}</span>
                          <div className="col-span-3 border-t border-zinc-900 my-1"></div>
                          <span className="text-mangoGold font-bold">Net Total:</span> <span className="col-span-2 text-mangoGold font-bold text-sm">{msg.cardData.total}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {state.chatStatus === 'Processing' && state.ocrStage === 'idle' && (
                <div className="flex gap-3 mr-auto items-center text-xs text-zinc-400 bg-zinc-900/60 px-3 py-2 rounded-lg border border-zinc-800/50 w-max">
                  <Loader2 className="w-3.5 h-3.5 text-mangoGold animate-spin" />
                  <span>Parsing structural intent tokens via Gemini API...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Form Input Action Wrapper */}
            <form onSubmit={handleSend} className="p-3 bg-zinc-900/60 border-t border-zinc-800/80 backend-blur-sm">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-mangoGold/50 rounded-xl p-1.5 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything or use command: Bill Acme Corp $1,200 for web design, 10% tax..."
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none px-3"
                  disabled={state.chatStatus === 'Processing'}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || state.chatStatus === 'Processing'}
                  className="p-2.5 bg-mangoGold text-zinc-950 font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-30 disabled:hover:bg-mangoGold transition shadow-md flex items-center justify-center"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>

          {/* FEATURE 2: Receipt OCR Ingestion Zone */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-mangoGold" /> Receipt Scanner (OCR)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Gemini Vision ingestion pipeline sandbox node interface</p>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleOcrInference} accept="image/*" className="hidden" />

            <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-6 flex flex-col items-center justify-center border-dashed border-zinc-700 hover:border-mangoGold/40 transition group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition shadow-inner">
                <Camera className="w-5 h-5 text-zinc-400 group-hover:text-mangoGold transition" />
              </div>
              <span className="text-sm font-medium text-zinc-300 mt-3">Drop or upload receipt image</span>
              <span className="text-[11px] text-zinc-600 mt-1 font-mono">JPG · PNG · simulated Gemini Vision ingestion matrix</span>
            </div>

            {/* Automated OCR Progress Logs Dashboard */}
            {state.ocrStage !== 'idle' && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500 text-[11px] uppercase tracking-wide">OCR Pipeline Stepper Log:</span>
                  <span className="text-mangoGold uppercase text-[10px] bg-mangoGold/10 px-2 py-0.5 rounded border border-mangoGold/20">{state.ocrStage}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-[11px]">
                  <div className={`p-2 rounded border transition-all ${state.ocrStage === 'uploading' ? 'bg-mangoGold/10 border-mangoGold/40 text-mangoGold font-bold' : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500'}`}>
                    Uploading receipt image...
                  </div>
                  <div className={`p-2 rounded border transition-all ${state.ocrStage === 'ocr' ? 'bg-mangoGold/10 border-mangoGold/40 text-mangoGold font-bold' : state.ocrStage === 'extracting' || state.ocrStage === 'done' ? 'text-zinc-400 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500'}`}>
                    Running Gemini Vision OCR...
                  </div>
                  <div className={`p-2 rounded border transition-all ${state.ocrStage === 'extracting' ? 'bg-mangoGold/10 border-mangoGold/40 text-mangoGold font-bold' : state.ocrStage === 'done' ? 'text-zinc-400 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500'}`}>
                    Extracting line items & totals...
                  </div>
                  <div className={`p-2 rounded border transition-all ${state.ocrStage === 'done' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500'}`}>
                    Receipt parsed successfully.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column blocks: Recurring Switch & Unified Ledger */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* FEATURE 3: Recurring Scheduler Selector */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-mangoGold" /> Recurring Configuration
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Apply automatic scheduler engines directly to current active workflows</p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { label: 'Every 1st of month', value: 'Monthly (1st)' },
                { label: 'Every 15th of month', value: 'Monthly (15th)' },
                { label: 'Every Monday', value: 'Weekly (Mon)' },
                { label: 'Every quarter (1st)', value: 'Quarterly' }
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FREQUENCY', payload: preset.value })}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    state.unifiedDraft.frequency === preset.value 
                      ? 'bg-mangoGold border-yellow-500 text-zinc-950 font-bold shadow-md' 
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {state.unifiedDraft.frequency !== 'One-time' && (
              <div className="bg-mangoGold/5 border border-mangoGold/20 px-3 py-2 rounded-xl text-[11px] text-mangoGold/90 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-mangoGold animate-ping"></span>
                <span>Active Task: Tracking logic applied to schedule: {state.unifiedDraft.frequency}.</span>
              </div>
            )}
          </div>

          {/* MASTER PANELS: Master Sync View Dynamic Output Ledger */}
          <div className="bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-5 space-y-4 relative shadow-2xl">
            <div className="absolute top-0 right-5 transform -translate-y-1/2 bg-mangoGold text-zinc-950 font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
              Master Sync View
            </div>

            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layers className="w-4 h-4 text-mangoGold" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Unified Draft Payload</span>
            </div>

            <div className="space-y-3 font-mono text-xs bg-zinc-950 border border-zinc-800/60 p-4 rounded-xl shadow-inner">
              <div className="flex flex-col border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Client Context Entity</span>
                <span className="text-zinc-200 font-semibold mt-0.5 text-sm">{state.unifiedDraft.client}</span>
              </div>
              <div className="flex flex-col border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Description Context</span>
                <span className="text-zinc-400 mt-0.5 truncate">{state.unifiedDraft.description}</span>
              </div>
              <div className="flex flex-col border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Subtotal Volume Base</span>
                <span className="text-zinc-300 font-medium mt-0.5 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-zinc-500" /> {state.unifiedDraft.subtotal}
                </span>
              </div>
              <div className="flex flex-col border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Calculated Tax Fraction</span>
                <span className="text-zinc-400 mt-0.5">{state.unifiedDraft.tax}</span>
              </div>
              <div className="flex flex-col border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Scheduler Loop Interval</span>
                <span className="text-mangoGold font-medium mt-0.5">{state.unifiedDraft.frequency}</span>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Net Payable Total Gross</span>
                <span className="text-mangoGold font-bold text-base mt-0.5">{state.unifiedDraft.total}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={state.unifiedDraft.client === '—'}
              className="w-full py-3 bg-mangoGold hover:bg-yellow-400 disabled:opacity-20 disabled:hover:bg-mangoGold text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 uppercase tracking-wider"
              onClick={handleCommitToLedger}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> Commit Draft to Ledger
            </button>          
          </div>
        </div>
      </div>
    </div>
  );
}