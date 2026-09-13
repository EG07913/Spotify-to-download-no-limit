import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileAudio,
  Image as ImageIcon,
  Search,
  Disc3,
  Smartphone,
  Check
} from 'lucide-react';
import { ID3Frame, DeviceProfile } from '../types';

export const MetadataSimulator: React.FC = () => {
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>('ipod');
  const [playlistName, setPlaylistName] = useState('Rock & Metal: Greatest Hits (Vol. 1)');
  const [title, setTitle] = useState('Thunderstruck / Live "Special"? <1992>');
  const [artist, setArtist] = useState('AC/DC');
  const [album, setAlbum] = useState('The Razors Edge (Remastered)');
  const [year, setYear] = useState('1990');
  const [trackNumber, setTrackNumber] = useState(1);
  const [totalTracks, setTotalTracks] = useState(14);

  // Exact Python sanitizer recreation in TypeScript
  const sanitizeFilename = (raw: string, maxLen = 60, strict = false) => {
    let s = raw.replace(/[\x00-\x1f\\/:*?"<>|]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/^[.\s]+|[.\s]+$/g, '');
    if (!s) s = 'untitled';
    return s.slice(0, maxLen);
  };

  const isIpod = deviceProfile === 'ipod';
  const cleanPlaylist = sanitizeFilename(playlistName, isIpod ? 50 : 80, isIpod);
  const cleanArtist = sanitizeFilename(artist, isIpod ? 50 : 80, isIpod);
  const cleanTitle = sanitizeFilename(title, isIpod ? 50 : 80, isIpod);
  const padLen = totalTracks >= 100 ? 3 : 2;
  const trackNumStr = String(trackNumber).padStart(padLen, '0');
  const finalFilename = `${trackNumStr} - ${cleanArtist} - ${cleanTitle}.mp3`;
  const fullPath = `./downloads/${cleanPlaylist}/${finalFilename}`;

  const ytQuery = `ytsearch1:"${title} ${artist} official audio"`;

  const ipodId3Frames: ID3Frame[] = [
    {
      tag: 'TIT2',
      name: 'Title Frame',
      encoding: 'UTF-16 (BOM)',
      value: title,
      note: 'Properly displays all international Unicode characters and accents without iPod firmware freeze.'
    },
    {
      tag: 'TPE1',
      name: 'Lead Artist / Performer',
      encoding: 'UTF-16 (BOM)',
      value: artist,
      note: 'Avoids "Unknown Artist" bug caused by ID3v2.4 UTF-8 on older Apple iPod firmware.'
    },
    {
      tag: 'TALB',
      name: 'Album Name',
      encoding: 'UTF-16 (BOM)',
      value: album,
      note: 'Ensures iTunes/Finder correctly bundles the track under the same album.'
    },
    {
      tag: 'TYER',
      name: 'Year',
      encoding: 'UTF-16 (BOM)',
      value: year,
      note: 'ID3v2.3 4-digit year frame (ID3v2.4 uses TDRC date-time timestamp which iPod nano often ignores).'
    },
    {
      tag: 'TRCK',
      name: 'Track / Total',
      encoding: 'UTF-16 (BOM)',
      value: `${trackNumber}/${totalTracks}`,
      note: 'Preserves the strict album listening track order on iPod nano.'
    },
    {
      tag: 'APIC',
      name: 'Attached Picture (Front Cover)',
      encoding: 'UTF-16 / JPEG',
      value: '500x500 px JPEG (baseline, RGB, 88% Q)',
      note: 'Pillow downsamples oversized Spotify art to 500x500 to prevent iPod UI stuttering or memory panic.'
    }
  ];

  const modernId3Frames: ID3Frame[] = [
    {
      tag: 'TIT2',
      name: 'Title Frame',
      encoding: 'UTF-8 (Native)',
      value: title,
      note: 'Full standard Unicode UTF-8 strings natively indexed by Android MediaStore and iOS CoreAudio.'
    },
    {
      tag: 'TPE1',
      name: 'Lead Artist / Performer',
      encoding: 'UTF-8 (Native)',
      value: artist,
      note: 'Full unconstrained artist naming with support for multiple collaborators and featured artists.'
    },
    {
      tag: 'TALB',
      name: 'Album Name',
      encoding: 'UTF-8 (Native)',
      value: album,
      note: 'Full complete album name with luxury subtitle / remaster tags.'
    },
    {
      tag: 'TDRC',
      name: 'Recording Date Timestamp',
      encoding: 'UTF-8 (Native)',
      value: `${year}-09-24`,
      note: 'Modern ID3v2.4 full ISO 8601 release timestamp used by modern music library managers.'
    },
    {
      tag: 'TRCK',
      name: 'Track / Total',
      encoding: 'UTF-8 (Native)',
      value: `${trackNumber}/${totalTracks}`,
      note: 'Standard track ordering displayed in modern lock-screen players.'
    },
    {
      tag: 'TSSE',
      name: 'Encoder Signature',
      encoding: 'UTF-8 (Native)',
      value: 'FFmpeg LAME 320kbps (Modern Hi-Fi)',
      note: 'Indicates high-efficiency audiophile encoding pass.'
    },
    {
      tag: 'APIC',
      name: 'Attached Picture (Front Cover)',
      encoding: 'UTF-8 / JPEG',
      value: 'Original High-Res (Up to 1400x1400, 95% Q)',
      note: 'Crisp artwork displayed on Google Pixel 10 Pro & iPhone Super Retina OLED screens.'
    }
  ];

  const activeFrames = isIpod ? ipodId3Frames : modernId3Frames;

  return (
    <div className="space-y-6">
      {/* Top Controls: Interactive Switcher */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-700" />
              Live Tagging &amp; Codec Simulator
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Compare how tags, artwork size, and audio specs adapt when switching between iPod and Modern Device modes.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setDeviceProfile('ipod')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isIpod
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5 text-amber-600" />
              iPod Mode (Restraints)
            </button>
            <button
              onClick={() => setDeviceProfile('modern')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isIpod
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Modern Device (Max Quality)
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Metadata Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-3.5">
              Simulated Spotify Track Input
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Playlist Name</label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Track Title (with special chars)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Artist</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Album</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Year</label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Track #</label>
                  <input
                    type="number"
                    value={trackNumber}
                    min="1"
                    onChange={(e) => setTrackNumber(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Total</label>
                  <input
                    type="number"
                    value={totalTracks}
                    min="1"
                    onChange={(e) => setTotalTracks(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audio Engine Specs Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5 text-stone-600" />
              FFmpeg Audio Engine Parameters
            </h3>
            <div className="space-y-2 text-xs font-mono bg-stone-900 text-stone-200 p-3.5 rounded-xl border border-stone-800">
              <div className="text-emerald-400 text-2xs uppercase tracking-wider font-sans font-semibold">
                yt-dlp Postprocessor Arguments ({deviceProfile.toUpperCase()} PROFILE)
              </div>
              <div className="text-stone-300">
                {isIpod ? (
                  <>
                    <div>-ar 44100</div>
                    <div>-ac 2</div>
                    <div>-b:a 320k</div>
                    <div className="text-stone-500 text-2xs font-sans mt-1.5">
                      Fixed 44.1 kHz prevents hardware sample rate conversion jitter on iPod nano DAC.
                    </div>
                  </>
                ) : (
                  <>
                    <div>-ar 48000</div>
                    <div>-ac 2</div>
                    <div>-b:a 320k</div>
                    <div>-q:a 0</div>
                    <div className="text-emerald-400/90 text-2xs font-sans mt-1.5">
                      Highest-quality VBR/CBR pass preserving 48.0 kHz native to Android/iOS Hi-Res engines.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Resulting Tags & File Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {/* File Output Preview */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Sanitized Target File Path
              </h3>
              <span className={`text-2xs font-semibold px-2 py-0.5 rounded-md border ${
                isIpod
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {isIpod ? 'FAT32 Restricted' : 'Modern Ext4 / APFS'}
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 font-mono text-xs text-stone-800 break-all select-all">
              {fullPath}
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-2xs text-stone-500">
              <span>Illegal characters stripped:</span>
              <code className="font-mono bg-stone-100 px-1 py-0.2 rounded text-rose-700 font-bold">\ / : * ? &quot; &lt; &gt; |</code>
            </div>
          </div>

          {/* ID3 Tag Table */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                Embedded ID3 Metadata Frames ({isIpod ? 'ID3v2.3 UTF-16' : 'ID3v2.4 UTF-8'})
              </h3>
              <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                isIpod ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isIpod ? 'v2_version=3' : 'v2_version=4'}
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-700 border-b border-stone-200 font-medium">
                  <tr>
                    <th className="py-2 px-3">Frame</th>
                    <th className="py-2 px-3">Encoding</th>
                    <th className="py-2 px-3">Value</th>
                    <th className="py-2 px-3">Device Compatibility Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activeFrames.map((frame) => (
                    <tr key={frame.tag} className="hover:bg-stone-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900 text-2xs">
                        {frame.tag}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 font-mono text-2xs">
                        {frame.encoding}
                      </td>
                      <td className="py-2.5 px-3 text-stone-800 font-medium">
                        {frame.value}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 text-2xs leading-relaxed">
                        {frame.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
