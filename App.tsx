
import React, { useState } from 'react';
import { 
  FolderIcon, 
  ClipboardDocumentCheckIcon, 
  CommandLineIcon, 
  SparklesIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CpuChipIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { FOLDER_STRUCTURE, SETUP_STEPS } from './constants';
import { FolderNode, SetupStep, AIAnalysisResult } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const NavItem: React.FC<{ 
  label: string; 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void 
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const FolderTree: React.FC<{ node: FolderNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth === 0);

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-2 px-3 rounded-lg hover:bg-white cursor-pointer transition-colors ${depth === 0 ? 'mt-2' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2" style={{ marginLeft: `${depth * 20}px` }}>
          <ChevronRightIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          <FolderIcon className={`w-5 h-5 ${node.isTopLevel ? 'text-blue-500' : 'text-slate-400'}`} />
          <span className={`${node.isTopLevel ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
            {node.name}
          </span>
          {node.description && depth === 0 && (
            <span className="text-xs text-slate-400 italic hidden md:inline">— {node.description}</span>
          )}
        </div>
      </div>
      {isOpen && node.subfolders && (
        <div className="border-l border-slate-200 ml-6">
          {node.subfolders.map((sub, idx) => (
            <FolderTree key={idx} node={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'structure' | 'naming' | 'guide' | 'automation' | 'ai'>('structure');
  const [namingInput, setNamingInput] = useState({ date: new Date().toISOString().split('T')[0], subject: 'Physics', topic: 'Thermodynamics', version: 'v1' });
  
  // AI States
  const [fileList, setFileList] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Generate a script to create the baseline structure
  const generateBaselineScript = () => {
    const lines: string[] = [`Set-Location "$HOME\\Documents"`];
    const walk = (nodes: FolderNode[], path: string = "") => {
      nodes.forEach(node => {
        const currentPath = path ? `${path}\\${node.name}` : node.name;
        lines.push(`New-Item -ItemType Directory -Force -Path "${currentPath}" | Out-Null`);
        if (node.subfolders) walk(node.subfolders, currentPath);
      });
    };
    walk(FOLDER_STRUCTURE);
    lines.push(`Write-Host "Success! Your new structure has been created in Documents." -ForegroundColor Green`);
    return lines.join("\n");
  };

  const runAIAnalysis = async () => {
    if (!fileList.trim()) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a Windows 10 expert. Analyze this list of files. 
        Context: The user is a student preparing for JEE 2027.
        Files:
        ${fileList}
        
        Generate a JSON response that categorizes these files and provides a ROBUST PowerShell script.
        The PowerShell script MUST:
        1. Use 'Write-Host' to inform the user what it is doing (e.g., 'Creating folder X', 'Moving file Y').
        2. Create directories using New-Item -ItemType Directory -Force.
        3. Use absolute paths where possible starting from $HOME.
        4. Include a final success message.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                    percentage: { type: Type.NUMBER }
                  },
                  required: ['name', 'count', 'percentage']
                }
              },
              problems: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              proposedStructure: { type: Type.STRING },
              namingExamples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    old: { type: Type.STRING },
                    new: { type: Type.STRING }
                  },
                  required: ['old', 'new']
                }
              },
              powershellScript: { type: Type.STRING }
            },
            required: ['categories', 'problems', 'proposedStructure', 'namingExamples', 'powershellScript']
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      setAiResult(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'structure':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Top-Level Folder Structure</h1>
                <p className="text-slate-500 mt-2">Recreate this tree inside your <strong>Documents</strong> folder.</p>
              </div>
              <button 
                onClick={() => {
                  const script = generateBaselineScript();
                  navigator.clipboard.writeText(script);
                  alert("PowerShell Script Copied! Paste it into a PowerShell window to create your folders.");
                }}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 hover:bg-slate-800 transition-colors shadow-lg"
              >
                <WrenchScrewdriverIcon className="w-4 h-4" />
                <span>Copy Setup Script</span>
              </button>
            </header>
            <div className="bg-slate-100/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
              {FOLDER_STRUCTURE.map((node, idx) => (
                <FolderTree key={idx} node={node} />
              ))}
            </div>
            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-4">
              <InformationCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">How to use the script:</h4>
                <p className="text-blue-800 text-sm leading-relaxed mt-1">
                  1. Click <strong>Copy Setup Script</strong> above.<br/>
                  2. Open <strong>PowerShell</strong> (search Start for it).<br/>
                  3. Right-click in the PowerShell window to paste and hit Enter.
                </p>
              </div>
            </div>
          </div>
        );
      case 'naming':
        const exampleName = `${namingInput.date}_${namingInput.subject.replace(/\s+/g, '_')}_${namingInput.topic.replace(/\s+/g, '_')}_${namingInput.version}.pdf`;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Naming Convention</h1>
              <p className="text-slate-500 mt-2">Standardized naming makes searching instant. No more 'Final_Final_2.doc'.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Rule: ISO Date + Subject + Topic</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-slate-200 rounded-lg" 
                      value={namingInput.date}
                      onChange={(e) => setNamingInput({...namingInput, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Subject</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg" 
                      placeholder="e.g. Physics"
                      value={namingInput.subject}
                      onChange={(e) => setNamingInput({...namingInput, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Topic</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg" 
                      placeholder="e.g. Thermodynamics"
                      value={namingInput.topic}
                      onChange={(e) => setNamingInput({...namingInput, topic: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
                <h3 className="text-blue-400 font-mono text-sm mb-4 tracking-widest uppercase">Resulting Filename</h3>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 break-all font-mono text-lg text-emerald-400">
                  {exampleName}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(exampleName)}
                  className="mt-6 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg font-bold transition-colors text-sm"
                >
                  Copy Example
                </button>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <h3 className="text-xl font-bold">Example Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Exam Paper', name: '2026-05-12_Math_JEE-Advanced_Mock-01.pdf' },
                  { title: 'Project Draft', name: '2027-01-20_Chemistry_Periodic-Table_Draft-v1.docx' },
                  { title: 'Personal Doc', name: '2025-12-01_Identity_Aadhar-Card_Scan.jpg' }
                ].map((ex, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">{ex.title}</p>
                    <p className="font-mono text-xs text-slate-600">{ex.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'guide':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Step-by-Step Setup</h1>
              <p className="text-slate-500 mt-2">Follow these instructions exactly to overhaul your PC in 15 minutes.</p>
            </header>
            <div className="space-y-6">
              {SETUP_STEPS.map((step) => (
                <div key={step.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex space-x-6">
                  <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl">
                    {step.category === 'Desktop' && '🖥️'}
                    {step.category === 'Downloads' && '📥'}
                    {step.category === 'QuickAccess' && '📌'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                      {step.title}
                      <span className="ml-3 text-xs font-normal bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{step.category}</span>
                    </h3>
                    <p className="text-slate-500 mt-1">{step.description}</p>
                    <ul className="mt-4 space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start space-x-3 text-slate-700">
                          <CheckCircleIcon className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'automation':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Beginner-Friendly Automation</h1>
              <p className="text-slate-500 mt-2">Let the computer do the boring work for you using PowerShell.</p>
            </header>
            <div className="bg-slate-900 text-slate-100 p-8 rounded-3xl shadow-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                <CommandLineIcon className="w-6 h-6 mr-2" />
                Script: Auto-Delete Old Downloads
              </h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                This simple one-line script deletes files in your Downloads folder that are older than 30 days. 
                Keep it in a text file named <code>CleanDownloads.ps1</code>.
              </p>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 font-mono text-sm text-emerald-300 overflow-x-auto">
                {`Get-ChildItem -Path "$HOME\\Downloads" -Recurse | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force`}
              </div>
              
              <div className="mt-12 space-y-6">
                <h4 className="font-bold text-white text-lg">How to use:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <span className="text-blue-400 font-bold block mb-2">Step 1: Test</span>
                    <p className="text-sm text-slate-300">Open 'PowerShell' from Start menu, paste the code, and hit Enter to clean immediately.</p>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <span className="text-blue-400 font-bold block mb-2">Step 2: Automate</span>
                    <p className="text-sm text-slate-300">Open 'Task Scheduler', create a new task to run this script every Sunday morning.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
              <div className="flex items-center space-x-3">
                <CpuChipIcon className="w-8 h-8 text-indigo-500" />
                <h1 className="text-3xl font-bold text-slate-900">AI File Optimizer</h1>
              </div>
              <p className="text-slate-500 mt-2 italic">Paste your messy file list and let Gemini design your custom system.</p>
            </header>

            {!aiResult ? (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs mr-2">1</span>
                    Get your file list
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Open Command Prompt (CMD) in Windows, go to your messy folder, and run:
                  </p>
                  <div className="bg-slate-800 p-4 rounded-xl font-mono text-emerald-400 text-sm mb-6 select-all">
                    dir /b /s > files.txt
                  </div>
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs mr-2">2</span>
                    Paste the contents of files.txt below
                  </h3>
                  <textarea 
                    className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                    placeholder="C:\Users\Student\Downloads\Physics_Notes_Final.pdf&#10;C:\Users\Student\Downloads\Screenshot_12.png..."
                    value={fileList}
                    onChange={(e) => setFileList(e.target.value)}
                  />
                  <button 
                    disabled={isAnalyzing || !fileList.trim()}
                    onClick={runAIAnalysis}
                    className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
                  >
                    {isAnalyzing ? (
                      <><ArrowPathIcon className="w-5 h-5 animate-spin" /> <span>Analyzing your digital mess...</span></>
                    ) : (
                      <><SparklesIcon className="w-5 h-5" /> <span>Generate Custom Plan</span></>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <ArrowPathIcon className="w-5 h-5 mr-2 text-blue-500" />
                      Detected Categories
                    </h3>
                    <div className="space-y-4">
                      {aiResult.categories.map((cat, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{cat.name}</span>
                            <span className="text-slate-400">{cat.count} files</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${cat.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <h3 className="font-bold text-red-800 mb-4 flex items-center">
                      <InformationCircleIcon className="w-5 h-5 mr-2" />
                      Pain Points
                    </h3>
                    <ul className="text-xs space-y-2 text-red-700">
                      {aiResult.problems.map((prob, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2 opacity-50">•</span> {prob}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Proposed Custom Structure</h3>
                  <div className="bg-slate-50 p-6 rounded-xl font-mono text-sm border border-slate-100 whitespace-pre-wrap">
                    {aiResult.proposedStructure}
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-100 p-8 rounded-3xl shadow-2xl border-t-8 border-emerald-500">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-emerald-400 flex items-center">
                        <CommandLineIcon className="w-6 h-6 mr-2" />
                        Custom PowerShell Deployment Script
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Use <strong>PowerShell</strong> (not CMD) to run this. It provides feedback while moving files.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiResult.powershellScript);
                        alert("Copied to clipboard!");
                      }}
                      className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      <span>Copy Script</span>
                    </button>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 font-mono text-xs text-emerald-300 overflow-x-auto max-h-96 overflow-y-auto">
                    {aiResult.powershellScript}
                  </div>
                </div>

                <button 
                  onClick={() => setAiResult(null)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  ← Start Over with new file list
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col space-y-8 sticky top-0 h-auto md:h-screen">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">Productivity</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Windows 10 OS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem 
            label="Folder Structure" 
            icon={<FolderIcon className="w-5 h-5" />} 
            active={activeTab === 'structure'} 
            onClick={() => setActiveTab('structure')} 
          />
          <NavItem 
            label="Naming Rules" 
            icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} 
            active={activeTab === 'naming'} 
            onClick={() => setActiveTab('naming')} 
          />
          <NavItem 
            label="Setup Guide" 
            icon={<CheckCircleIcon className="w-5 h-5" />} 
            active={activeTab === 'guide'} 
            onClick={() => setActiveTab('guide')} 
          />
          <NavItem 
            label="AI Optimizer" 
            icon={<CpuChipIcon className="w-5 h-5" />} 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <NavItem 
            label="Automation" 
            icon={<CommandLineIcon className="w-5 h-5" />} 
            active={activeTab === 'automation'} 
            onClick={() => setActiveTab('automation')} 
          />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs text-slate-400 leading-relaxed italic text-center">
            "A cluttered space leads to a cluttered mind. Organize today, study better tomorrow."
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 max-w-5xl overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
