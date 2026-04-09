import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  User,
  MessageSquare,
  FileText,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw
} from "lucide-react";
import { evalSet, Scenario } from './data/evalSet';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(evalSet[0]);
  const [draft, setDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateDraft = async (scenario: Scenario) => {
    setIsGenerating(true);
    setError(null);
    setDraft('');

    try {
      const systemInstruction = `
        You are an expert Customer Success Manager (CSM). Your goal is to draft professional, context-aware email responses to customers.
        Guidelines:
        1. Clearly address the customer's request or concern.
        2. Maintain the requested tone (e.g., Empathetic, Professional, Persuasive).
        3. Use internal notes to provide accurate information.
        4. Avoid making unsupported claims or promises.
        5. Ensure the email is polished and ready for a CSM to review and send.
        6. Use placeholders like [Customer Name] or [My Name] where appropriate.
      `;

      const prompt = `
        Customer Scenario: ${scenario.scenario}
        Customer Message: ${scenario.customer_message}
        Requested Tone: ${scenario.context.tone}
        Internal Notes: ${scenario.context.internal_notes}

        Please provide a polished email draft.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      if (response.text) {
        setDraft(response.text);
      } else {
        throw new Error("No response text generated.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate draft. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedScenario) {
      generateDraft(selectedScenario);
    }
  }, [selectedScenario]);

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Mail className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CSM Email Drafter</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Workflow Prototype</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Gemini 3 Flash Active
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Scenarios List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Evaluation Set</h2>
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-md font-mono">{evalSet.length} Scenarios</span>
          </div>
          <div className="space-y-3">
            {evalSet.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedScenario(item)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  selectedScenario?.id === item.id
                    ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    selectedScenario?.id === item.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.scenario.split(' - ')[0]}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedScenario?.id === item.id ? 'text-blue-500 rotate-90' : 'text-gray-300'}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.scenario}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 italic">"{item.customer_message}"</p>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Python Prototype
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              This web interface mirrors the logic in <code className="bg-blue-100 px-1 rounded">app.py</code>.
              You can find the standalone Python script in the file explorer.
            </p>
          </div>
        </div>

        {/* Main Content: Draft Area */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {selectedScenario && (
              <motion.div
                key={selectedScenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Input Context Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Customer Context</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wider">
                        Tone: {selectedScenario.context.tone}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Message</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 italic leading-relaxed">
                        "{selectedScenario.customer_message}"
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Notes</label>
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-800 leading-relaxed">
                        {selectedScenario.context.internal_notes}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Output Draft Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden min-h-[400px] flex flex-col">
                  <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">Generated Email Draft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {draft && (
                        <>
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => generateDraft(selectedScenario)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-8 relative">
                    {isGenerating ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-sm font-medium text-gray-500 animate-pulse">Drafting professional response...</p>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-sm text-gray-500 max-w-xs">{error}</p>
                        <button
                          onClick={() => generateDraft(selectedScenario)}
                          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : draft ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose prose-sm max-w-none"
                      >
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-base">
                          {draft}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                        <Mail className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-sm font-medium">Select a scenario to generate a draft</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">AI</div>
                        <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">CS</div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collaborative Drafting</span>
                    </div>
                    <button
                      disabled={!draft || isGenerating}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-200"
                    >
                      <Send className="w-4 h-4" />
                      Review & Send
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 p-1.5 rounded">
                <Mail className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-sm">CSM Email Drafter</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              A professional tool designed to help Customer Success Managers maintain consistency and efficiency in their communications.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workflow Components</h4>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Context-Aware Generation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Multi-Tone Support</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Internal Note Integration</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prototype Info</h4>
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-[10px] text-gray-500 font-mono">
                Model: gemini-3-flash-preview<br />
                SDK: @google/genai<br />
                Status: Functional Prototype
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">© 2026 CSM Workflow Solutions</p>
          <div className="flex gap-4">
            <a href="#" className="text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Documentation</a>
            <a href="#" className="text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
