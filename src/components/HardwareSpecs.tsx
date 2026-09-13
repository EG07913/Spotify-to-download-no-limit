import React from 'react';
import { Cpu, ShieldAlert, CheckCircle2, Zap, Smartphone, Disc3, Layers, SlidersHorizontal } from 'lucide-react';

export const HardwareSpecs: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-stone-800" />
          <h2 className="text-base font-semibold text-stone-900 tracking-tight">
            Hardware Comparison: iPod Restraints vs. Modern Device Max Quality
          </h2>
        </div>
        <p className="text-stone-600 text-xs leading-relaxed mb-6">
          The CLI utility offers two dedicated modes. When targetting <strong>Apple iPod</strong>, it enforces strict legacy restraints to accommodate low-RAM firmware. When targetting <strong>Modern Devices</strong> (Google Pixel 10 Pro, modern Android, iPhone), it unleashes maximum fidelity audio, full-resolution artwork, and modern ID3v2.4 metadata.
        </p>

        {/* Technical Constraints Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-2 text-amber-900 font-semibold text-xs">
              <Disc3 className="w-4 h-4 text-amber-700" />
              iPod Mode Restraints (<code className="font-mono text-2xs bg-white px-1 rounded border border-amber-200">--target ipod</code>)
            </div>
            <ul className="text-stone-600 text-xs space-y-2 leading-relaxed">
              <li>
                <strong>Strict ID3v2.3:</strong> ID3v2.4 tags cause "Unknown Artist" and sync crashes on iPod nano 7th Gen. Forces <code className="font-mono text-2xs bg-stone-100 px-1 py-0.5 rounded">v2_version=3</code>.
              </li>
              <li>
                <strong>UTF-16 Text Encoding:</strong> UTF-8 in ID3v2.3 produces garbled characters (mojibake) on legacy Apple firmware. Forced UTF-16 BOM prevents this.
              </li>
              <li>
                <strong>500x500 Baseline JPEG:</strong> Pillow Lanczos downsamples artwork to 500x500 pixels. Progressive JPEG scans or large covers freeze the 64MB RAM iPod nano UI.
              </li>
              <li>
                <strong>44.1 kHz 320 kbps CBR:</strong> Matches the Cirrus Logic DAC clock natively. Prevents hardware software resampling distortion and saves battery.
              </li>
              <li>
                <strong>FAT32 Sanitization:</strong> Strips characters <code className="font-mono text-2xs bg-stone-100 px-1 py-0.5 rounded">\ / : * ? " &lt; &gt; |</code> and truncates filenames to prevent filesystem corruption.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-2 text-emerald-900 font-semibold text-xs">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              Modern Device Max Quality (<code className="font-mono text-2xs bg-white px-1 rounded border border-emerald-200">--target modern</code>)
            </div>
            <ul className="text-stone-600 text-xs space-y-2 leading-relaxed">
              <li>
                <strong>ID3v2.4 Specification:</strong> Uses the modern ID3v2.4 standard natively parsed by Android MediaStore and iOS CoreAudio frameworks.
              </li>
              <li>
                <strong>Native UTF-8 Encoding:</strong> Clean universal Unicode text encoding with zero truncation for long artist lists and international titles.
              </li>
              <li>
                <strong>Original Full-Res Cover Art:</strong> Preserves high-resolution artwork (up to 1400x1400px at 95% JPEG quality) for quad-HD OLED displays.
              </li>
              <li>
                <strong>Max Quality 320 kbps @ 48.0 kHz:</strong> Encodes with FFmpeg <code className="font-mono text-2xs bg-stone-100 px-1 py-0.5 rounded">-q:a 0 -b:a 320k -ar 48000</code>, matching Android's native audio engine and high-resolution Bluetooth LDAC codecs.
              </li>
              <li>
                <strong>Extended Tags:</strong> Adds <code className="font-mono text-2xs bg-stone-100 px-1 py-0.5 rounded">TDRC</code> (full ISO 8601 release date timestamp) and <code className="font-mono text-2xs bg-stone-100 px-1 py-0.5 rounded">TSSE</code> encoder signature.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hardware Comparison Table */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-600" />
          Technical Parameters: iPod Profile vs Modern Profile
        </h3>
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 border-b border-stone-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">Setting</th>
                <th className="py-2.5 px-3 text-amber-800">--target ipod (Restraints)</th>
                <th className="py-2.5 px-3 text-emerald-800">--target modern (Max Phone Quality)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Audio Bitrate</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-stone-700">320 kbps CBR (-b:a 320k)</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-emerald-700 font-semibold">320 kbps CBR (-b:a 320k -q:a 0 max pass)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Audio Sample Rate</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-stone-700">44.1 kHz (-ar 44100)</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-emerald-700 font-semibold">48.0 kHz (-ar 48000 native mobile audio)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Tag Version</td>
                <td className="py-2.5 px-3 text-amber-800 font-semibold">ID3v2.3 (Strictly required for iPod)</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">ID3v2.4 (Modern universal standard)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Text Encoding</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-stone-700">UTF-16 with Byte Order Mark (Encoding.UTF16)</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-stone-700">UTF-8 Native (Encoding.UTF8)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Cover Artwork (APIC)</td>
                <td className="py-2.5 px-3 text-stone-700">500x500 px baseline JPEG (88% Q)</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">Full resolution (up to 1400x1400 px, 95% Q)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Release Date Frame</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-stone-700">TYER (4-digit Year)</td>
                <td className="py-2.5 px-3 font-mono text-2xs text-stone-700">TDRC (Full ISO YYYY-MM-DD)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Filename Constraints</td>
                <td className="py-2.5 px-3 text-stone-700">Strict FAT32 (50 chars max per field)</td>
                <td className="py-2.5 px-3 text-stone-700">Full naming (80 chars max per field)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
