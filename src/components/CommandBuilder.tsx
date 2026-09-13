import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Sparkles,
  FolderDown,
  ShieldCheck,
  Smartphone,
  Disc3,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { DeviceProfile } from '../types';

export const CommandBuilder: React.FC = () => {
  const [targetDevice, setTargetDevice] = useState<DeviceProfile>('ipod');
  const [playlistUrl, setPlaylistUrl] = useState('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [outputDir, setOutputDir] = useState('./downloads');
  const [useEnv, setUseEnv] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const cleanUrl = playlistUrl.trim() || 'https://open.spotify.com/playlist/YOUR_PLAYLIST_ID';

  const targetFlag = `--target ${targetDevice}`;

  const cliCommand = useEnv
    ? `python spotify_to_ipod.py "${cleanUrl}" ${targetFlag} -o "${outputDir}"`
    : `python spotify_to_ipod.py "${cleanUrl}" ${targetFlag} --client-id "${clientId || 'YOUR_CLIENT_ID'}" --client-secret "${clientSecret || 'YOUR_CLIENT_SECRET'}" -o "${outputDir}"`;

  const envContent = `# .env file for Spotify Downloader
SPOTIPY_CLIENT_ID="${clientId || 'your_spotify_client_id_here'}"
SPOTIPY_CLIENT_SECRET="${clientSecret || 'your_spotify_client_secret_here'}"
`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div id="command-builder" className="space-y-8">
      {/* Device Mode Selector Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700">
                Target Device Hardware Profile
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Select whether you are generating files for a legacy Apple iPod or a modern flagship smartphone.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setTargetDevice('ipod')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                targetDevice === 'ipod'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5 text-amber-600" />
              Apple iPod
            </button>
            <button
              onClick={() => setTargetDevice('modern')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                targetDevice === 'modern'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Modern Device (Pixel / iPhone)
            </button>
          </div>
        </div>

        {/* Dynamic Profile Specification Callout */}
        {targetDevice === 'ipod' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-amber-900 block">Hardware Constraints</span>
              <span className="text-stone-600 leading-relaxed block">
                iPod nano 7th Gen (2015), Classic, Mini. Constrained 64MB RAM.
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-amber-900 block">Audio Encoding</span>
              <span className="text-stone-600 font-mono text-2xs block">
                320 kbps CBR @ 44.1 kHz Stereo
              </span>
              <span className="text-stone-500 text-2xs block">No DAC resampler distortion</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-amber-900 block">Metadata Standard</span>
              <span className="text-amber-800 font-semibold block">
                Strict ID3v2.3 UTF-16 (BOM)
              </span>
              <span className="text-stone-500 text-2xs block">Avoids "Unknown Artist" bug</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-amber-900 block">Cover Art Optimization</span>
              <span className="text-stone-700 font-medium block">
                500x500 Baseline JPEG
              </span>
              <span className="text-stone-500 text-2xs block">Pillow Lanczos downscaled</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-emerald-900 block">Target Flagships</span>
              <span className="text-stone-600 leading-relaxed block">
                Google Pixel 10 Pro, Galaxy S25/S26, iPhone 15/16/17+
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-emerald-900 block">Max Audiophile Audio</span>
              <span className="text-emerald-800 font-mono text-2xs font-semibold block">
                320 kbps CBR (-q:a 0) @ 48.0 kHz
              </span>
              <span className="text-stone-500 text-2xs block">Full Bluetooth LDAC/aptX fidelity</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-emerald-900 block">Metadata Standard</span>
              <span className="text-emerald-800 font-semibold block">
                Modern ID3v2.4 UTF-8 + TDRC
              </span>
              <span className="text-stone-500 text-2xs block">Exact ISO dates &amp; unlimited tags</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-emerald-900 block">Full-Res Cover Art</span>
              <span className="text-stone-700 font-medium block">
                High-Res (Up to 1400px, 95% Q)
              </span>
              <span className="text-stone-500 text-2xs block">Crisp on Quad-HD OLED screens</span>
            </div>
          </div>
        )}
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs transition-all hover:border-stone-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">1</span>
            <h3 className="font-semibold text-stone-900 text-sm">Spotify Metadata</h3>
          </div>
          <p className="text-stone-600 text-xs leading-relaxed">
            Uses <code className="bg-stone-100 px-1 py-0.5 rounded text-emerald-700 font-mono">spotipy</code> Client Credentials to pull public playlist tracks, pagination, track numbers, and high-res cover art.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs transition-all hover:border-stone-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center justify-center">2</span>
            <h3 className="font-semibold text-stone-900 text-sm">yt-dlp + FFmpeg Audio</h3>
          </div>
          <p className="text-stone-600 text-xs leading-relaxed">
            Extracts pristine audio via <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-800 font-mono">ytsearch1:</code> and encodes at 320 kbps with profile-matched sample rate (44.1kHz vs 48kHz).
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs transition-all hover:border-stone-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">3</span>
            <h3 className="font-semibold text-stone-900 text-sm">Adaptive Tagging &amp; Art</h3>
          </div>
          <p className="text-stone-600 text-xs leading-relaxed">
            Applies <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-700 font-mono">ID3v2.3 UTF-16</code> + 500x500 art for iPod, or <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-700 font-mono">ID3v2.4 UTF-8</code> + full-res art for modern phones.
          </p>
        </div>
      </div>

      {/* Command Generator Box */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-stone-100 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-stone-700" />
              CLI Command Generator
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Configured for <strong className="text-stone-800">{targetDevice === 'ipod' ? 'iPod Nano / Classic (--target ipod)' : 'Modern Device (--target modern)'}</strong>.
            </p>
          </div>
          <div className="flex items-center bg-stone-100 p-1 rounded-lg self-start">
            <button
              onClick={() => setUseEnv(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                useEnv ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Using .env / Environment
            </button>
            <button
              onClick={() => setUseEnv(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !useEnv ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Inline CLI Flags
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-stone-700">
                Spotify Playlist URL, ID, or Local File (.csv / .txt)
              </label>
              <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Supports 394+ tracks
              </span>
            </div>
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/... or playlist.csv"
              className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-stone-50/50"
            />
            <p className="text-2xs text-stone-500 mt-1">
              Supports Spotify links, or local CSV files exported via Exportify/Soundiiz for instant bulk download of 394+ tracks.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Target Device Flag
            </label>
            <div className="flex items-center gap-2">
              <select
                value={targetDevice}
                onChange={(e) => setTargetDevice(e.target.value as DeviceProfile)}
                className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-stone-50/50"
              >
                <option value="ipod">--target ipod (Restraints: 44.1kHz, ID3v2.3, 500x500 art)</option>
                <option value="modern">--target modern (Max Quality: 48kHz, ID3v2.4, Full-res art)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Output Destination Directory
            </label>
            <input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              placeholder="./downloads"
              className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Client ID {useEnv ? '(for .env file)' : '(CLI argument)'}
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 4a2b9c7d8e1f0..."
              className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-stone-50/50"
            />
          </div>

          {!useEnv && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Client Secret (CLI argument)
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="e.g. 9f8e7d6c5b4a3..."
                className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-stone-50/50"
              />
            </div>
          )}
        </div>

        {/* Generated Terminal Box */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 font-medium">
              <span>Terminal Execution Command</span>
              <button
                onClick={handleCopyCmd}
                className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors text-xs font-sans"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? 'Copied' : 'Copy command'}
              </button>
            </div>
            <div className="bg-stone-900 text-stone-100 font-mono text-xs rounded-xl p-4 overflow-x-auto select-all border border-stone-800 shadow-inner">
              <span className="text-emerald-400">$ </span>
              {cliCommand}
            </div>
          </div>

          {useEnv && (
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 font-medium">
                <span>Optional .env File Content</span>
                <button
                  onClick={handleCopyEnv}
                  className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors text-xs font-sans"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEnv ? 'Copied' : 'Copy .env snippet'}
                </button>
              </div>
              <pre className="bg-stone-900 text-stone-300 font-mono text-xs rounded-xl p-3.5 overflow-x-auto border border-stone-800">
                {envContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
