import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Search, CheckCircle } from 'lucide-react';
import { PYTHON_SCRIPT, REQUIREMENTS_TXT } from '../data/pythonCode';

export const CodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'script' | 'requirements'>('script');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentContent = activeFile === 'script' ? PYTHON_SCRIPT : REQUIREMENTS_TXT;
  const currentFilename = activeFile === 'script' ? 'spotify_to_ipod.py' : 'requirements.txt';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = currentContent.split('\n');
  const filteredLines = searchQuery
    ? lines.map((line, idx) => ({ line, num: idx + 1, matches: line.toLowerCase().includes(searchQuery.toLowerCase()) }))
    : lines.map((line, idx) => ({ line, num: idx + 1, matches: true }));

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-stone-50 border-b border-stone-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* File Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveFile('script'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFile === 'script'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            spotify_to_ipod.py
          </button>
          <button
            onClick={() => { setActiveFile('requirements'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFile === 'requirements'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-600" />
            requirements.txt
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-white border border-stone-200 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stone-400 w-36 sm:w-44"
            />
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors shadow-2xs"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
            title={`Download ${currentFilename}`}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="bg-stone-950 text-stone-200 font-mono text-xs overflow-x-auto max-h-[620px] p-4">
        <table className="w-full border-collapse">
          <tbody>
            {filteredLines.map(({ line, num, matches }) => {
              if (searchQuery && !matches) return null;
              return (
                <tr key={num} className={`hover:bg-stone-900/80 ${searchQuery && matches ? 'bg-amber-950/40' : ''}`}>
                  <td className="text-stone-600 select-none text-right pr-4 align-top w-12 text-2xs py-0.5">
                    {num}
                  </td>
                  <td className="whitespace-pre font-mono text-stone-300 py-0.5">
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="bg-stone-50 border-t border-stone-200 px-5 py-2.5 text-2xs text-stone-500 flex items-center justify-between">
        <span>File: {currentFilename} ({lines.length} lines)</span>
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle className="w-3.5 h-3.5" /> Tested &amp; validated with Python 3.10+
        </span>
      </div>
    </div>
  );
};
