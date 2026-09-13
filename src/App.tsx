import React, { useState } from 'react';
import {
  Terminal,
  Sliders,
  FileCode,
  BookOpen,
  Cpu,
  Download,
  Music2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Smartphone,
  Disc3
} from 'lucide-react';
import { CommandBuilder } from './components/CommandBuilder';
import { MetadataSimulator } from './components/MetadataSimulator';
import { CodeViewer } from './components/CodeViewer';
import { SetupGuide } from './components/SetupGuide';
import { HardwareSpecs } from './components/HardwareSpecs';
import { ActiveTab } from './types';
import { PYTHON_SCRIPT, REQUIREMENTS_TXT } from './data/pythonCode';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 font-sans antialiased pb-16">
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <Music2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  Spotify to iPod &amp; Modern Device MP3 Generator
                </h1>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Dual Mode
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Choose between strict <strong>iPod restraints</strong> (ID3v2.3, 500x500 art, 44.1kHz) or <strong>modern device max quality</strong> (ID3v2.4, full-res art, 48kHz).
              </p>
            </div>
          </div>

          {/* Direct Download Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadFile('requirements.txt', REQUIREMENTS_TXT)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              requirements.txt
            </button>
            <button
              onClick={() => downloadFile('spotify_to_ipod.py', PYTHON_SCRIPT)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              spotify_to_ipod.py
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-stone-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            CLI Generator
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'simulator'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Metadata Simulator
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'script'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Python Source Code
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'guide'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Setup &amp; Sync Guide
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'hardware'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Hardware &amp; Firmware Specs
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Hardware Status Strip */}
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-stone-900">Supported Device Targets:</span>
            <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Disc3 className="w-3 h-3 text-amber-700" />
              iPod Nano 7th Gen / Classic
            </span>
            <span className="text-stone-300">&bull;</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Smartphone className="w-3 h-3 text-emerald-700" />
              Google Pixel 10 Pro / Modern Phones
            </span>
          </div>

          <div className="flex items-center gap-2 text-2xs font-mono">
            <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">Flag: --target ipod | modern</span>
          </div>
        </div>

        {/* View Switching */}
        {activeTab === 'overview' && <CommandBuilder />}
        {activeTab === 'simulator' && <MetadataSimulator />}
        {activeTab === 'script' && <CodeViewer />}
        {activeTab === 'guide' && <SetupGuide />}
        {activeTab === 'hardware' && <HardwareSpecs />}
      </main>
    </div>
  );
}
