import React, { useState } from 'react';
import { Key, Video, Smartphone, Music, Check, Copy, ExternalLink, HardDrive, CheckCircle2 } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Spotify Credentials */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-700" />
            Spotify Access (Zero Credentials Needed!)
          </h2>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 mb-4 leading-relaxed">
          <strong>No Spotify Premium or Developer Account Needed:</strong> Spotify recently restricted their developer API to paid Spotify Premium accounts. To bypass this entirely, our script includes built-in <strong>Direct Public Extraction</strong>. You can simply run the script with your playlist link—no client ID, secret, or Spotify Premium required!
        </div>
        <p className="text-stone-600 text-xs mb-3 leading-relaxed">
          If you have a Spotify Developer account and want to configure official API tokens, you can still optionally provide them:
        </p>

        <ol className="space-y-3 text-xs text-stone-700 list-decimal list-inside pl-1">
          <li className="leading-relaxed">
            Open the{' '}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline font-medium inline-flex items-center gap-0.5"
            >
              Spotify Developer Dashboard <ExternalLink className="w-3 h-3" />
            </a>{' '}
            and log in with your Spotify account.
          </li>
          <li className="leading-relaxed">
            Click <strong>"Create app"</strong> and fill in:
            <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-stone-600">
              <li><strong>App name:</strong> <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">iPod Downloader</code></li>
              <li><strong>App description:</strong> <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">Personal music backup</code></li>
              <li>
                <strong>Redirect URI:</strong> <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">https://localhost:8888/callback</code> or <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">https://example.com/callback</code>{' '}
                <span className="text-stone-500">(be sure to use <strong>https://</strong> and click the purple <strong>"Add"</strong> button)</span>
              </li>
              <li><strong>Which API/SDKs are you planning to use:</strong> Select <strong>Web API</strong>.</li>
            </ul>
          </li>
          <li className="leading-relaxed">
            Check the Terms of Service box and click <strong>Save</strong>.
          </li>
          <li className="leading-relaxed">
            Go to <strong>Settings</strong> to view your <strong>Client ID</strong>, then click <strong>"View client secret"</strong> to reveal your <strong>Client Secret</strong>.
          </li>
        </ol>

        <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 font-mono flex items-center justify-between">
          <span>export SPOTIPY_CLIENT_ID="your_id" && export SPOTIPY_CLIENT_SECRET="your_secret"</span>
          <button
            onClick={() => copyToClipboard('export SPOTIPY_CLIENT_ID="your_id"\nexport SPOTIPY_CLIENT_SECRET="your_secret"', 'env')}
            className="text-stone-600 hover:text-stone-900 ml-2"
          >
            {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </section>

      {/* 2. FFmpeg Installation */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-700" />
            Install FFmpeg
          </h2>
        </div>
        <p className="text-stone-600 text-xs mb-4 leading-relaxed">
          <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-stone-800">ffmpeg</code> transcode streams into standard 320 kbps MP3 at 44.1 kHz. Select your operating system:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* macOS */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900">macOS (Homebrew)</span>
              <button
                onClick={() => copyToClipboard('brew install ffmpeg', 'brew')}
                className="text-stone-500 hover:text-stone-900"
              >
                {copiedKey === 'brew' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="block font-mono text-2xs bg-stone-900 text-stone-200 p-2 rounded-md select-all">
              brew install ffmpeg
            </code>
          </div>

          {/* Windows */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900">Windows (Built-in Winget)</span>
              <button
                onClick={() => copyToClipboard('winget install Gyan.FFmpeg', 'winget')}
                className="text-stone-500 hover:text-stone-900"
              >
                {copiedKey === 'winget' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="block font-mono text-2xs bg-stone-900 text-stone-200 p-2 rounded-md select-all mb-2">
              winget install Gyan.FFmpeg
            </code>
            <p className="text-stone-500 text-2xs">
              Pre-installed on Windows 10/11. No third-party package manager (like Chocolatey) required.
            </p>
          </div>

          {/* Linux */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900">Ubuntu / Debian</span>
              <button
                onClick={() => copyToClipboard('sudo apt update && sudo apt install -y ffmpeg', 'apt')}
                className="text-stone-500 hover:text-stone-900"
              >
                {copiedKey === 'apt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="block font-mono text-2xs bg-stone-900 text-stone-200 p-2 rounded-md select-all">
              sudo apt install -y ffmpeg
            </code>
          </div>
        </div>

        <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
          <span className="font-semibold text-stone-800">Don't have package managers? (Windows Manual Setup)</span>
          <p className="mt-1 leading-relaxed">
            Download the pre-compiled static build: get <a href="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-medium">ffmpeg-release-essentials.zip</a> from gyan.dev, unzip it (e.g. to <code className="font-mono text-2xs bg-white px-1 rounded border">C:\ffmpeg</code>), and add the <code className="font-mono text-2xs bg-white px-1 rounded border">C:\ffmpeg\bin</code> folder to your system PATH.
          </p>
        </div>
      </section>

      {/* 3. Sync to Apple iPod nano (7th Gen) */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Music className="w-4 h-4 text-blue-700" />
            Syncing to Apple iPod nano (7th Gen, 2015)
          </h2>
        </div>
        <p className="text-stone-600 text-xs mb-4 leading-relaxed">
          The iPod nano 7th generation syncs via macOS Finder (or iTunes on Windows). Because our script forces <strong>ID3v2.3 UTF-16</strong> and <strong>500x500 JPEG</strong>, iTunes/Finder imports it with 100% fidelity.
        </p>

        <div className="space-y-3 text-xs text-stone-700">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1">On macOS (Catalina, Big Sur, Monterey, Ventura, Sonoma, Sequoia):</h4>
            <p className="text-stone-600 mb-2">
              1. Open the <strong>Apple Music</strong> app.
              <br />2. Choose <strong>File &gt; Add to Library...</strong> (or press <kbd className="bg-stone-200 px-1 py-0.5 rounded text-2xs">Cmd + O</kbd>) and select the generated playlist directory in <code className="font-mono text-2xs">./downloads/</code>.
              <br />3. Plug in your iPod nano (7th Gen) using the Apple Lightning cable.
              <br />4. Click the iPod icon in the Finder sidebar, navigate to the <strong>Music</strong> tab, tick <strong>Sync Music</strong>, and select your playlist.
              <br />5. Click <strong>Apply / Sync</strong>.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1">On Windows (iTunes):</h4>
            <p className="text-stone-600 mb-2">
              1. Open <strong>iTunes</strong> for Windows.
              <br />2. Click <strong>File &gt; Add Folder to Library...</strong> and select the downloaded playlist folder.
              <br />3. Connect the iPod nano via USB. Click the device icon at the top left.
              <br />4. Under Settings &gt; Music, select <strong>Sync Music</strong> &gt; Selected playlists, artists, albums.
              <br />5. Click <strong>Sync</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Sync to Google Pixel 10 Pro & Modern Android */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-700" />
            Syncing to Google Pixel 10 Pro &amp; Modern Android
          </h2>
        </div>
        <p className="text-stone-600 text-xs mb-3 leading-relaxed">
          Modern Android phones have unrestricted local storage access. You can copy the MP3 folder directly:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-stone-700" /> USB-C Direct Drag &amp; Drop
            </h4>
            <p className="text-stone-600 leading-relaxed">
              Connect your Pixel 10 Pro with a USB-C cable. On the phone notification pull-down, tap USB settings and select <strong>File Transfer / MTP</strong>. Drag the playlist folder into <code className="font-mono text-2xs">Internal Storage/Music/</code>.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-stone-700" /> Quick Share / LocalSend
            </h4>
            <p className="text-stone-600 leading-relaxed">
              Use Google's <strong>Quick Share</strong> (built into Windows and Android) or open-source <strong>LocalSend</strong> to beam the entire album wirelessly in seconds over your local Wi-Fi.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Support for Large Playlists (394+ Tracks) */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            5
          </div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Large Playlists (394 Tracks) &amp; Resumable Sync
          </h2>
        </div>
        <p className="text-stone-600 text-xs mb-4 leading-relaxed">
          Can this system download and sync 394 tracks? <strong>Yes, absolutely.</strong> Here is how it works under the hood and how to get all 394 tracks:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1">iPod Storage Capacity</h4>
            <p className="text-stone-600 leading-relaxed">
              394 tracks at 320 kbps MP3 takes roughly <strong>2.8 GB to 3.2 GB</strong>. The iPod nano 7th Gen comes with <strong>16 GB</strong>, so 394 songs take less than 20% of its disk capacity.
            </p>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1">Auto-Resume &amp; Skip</h4>
            <p className="text-stone-600 leading-relaxed">
              Downloads run sequentially <code className="font-mono text-2xs">[1/394]...[394/394]</code>. If stopped or interrupted, re-running the command automatically skips already downloaded tracks.
            </p>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-1">RAM-Safe Artwork</h4>
            <p className="text-stone-600 leading-relaxed">
              Because album art is normalized to 500x500 baseline JPEGs, your iPod nano will smoothly scroll through all 394 album arts without running out of memory or lagging.
            </p>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 md:col-span-3">
            <h4 className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Automatic Audio Equivalent Engine (Zero Failed Songs)
            </h4>
            <p className="text-stone-600 leading-relaxed">
              If an official video upload or YouTube Music topic track says <code className="font-mono text-2xs bg-stone-200 px-1 py-0.5 rounded text-stone-800">This video is not available</code> in your region (common with film scores like <em>Strange Days Ahead</em> or <em>March of the Resistance</em>), the script automatically searches progressive candidate sources (movie soundtrack releases, studio audio, OST uploads), verifies track duration, and downloads the best audio equivalent.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-950">
            <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
            Fastest Way for 394 Tracks: 1-Click CSV Export
          </div>
          <p className="text-emerald-900 leading-relaxed">
            Spotify's public web embed delivers the first 100 songs without credentials. To instantly get all <strong>394 tracks</strong> without any API rate limits or developer keys:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-emerald-900 ml-1">
            <li>Visit <a href="https://exportify.net" target="_blank" rel="noopener noreferrer" className="underline font-semibold">exportify.net</a> (free 1-click Spotify playlist exporter).</li>
            <li>Click <strong>Export</strong> next to your playlist to save <code className="font-mono text-2xs bg-white px-1 py-0.5 rounded border border-emerald-200">playlist.csv</code>.</li>
            <li>Run the script with the CSV file:</li>
          </ol>
          <code className="block font-mono text-xs bg-stone-900 text-stone-100 p-2.5 rounded-lg select-all mt-2">
            python spotify_to_ipod.py "playlist.csv" --target ipod
          </code>
        </div>
      </section>
    </div>
  );
};
