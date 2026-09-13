# Spotify to iPod nano & Android 320kbps MP3 Generator

A Python command-line utility that extracts any public Spotify playlist, downloads the highest-quality audio streams via `yt-dlp`, converts them with `ffmpeg` to 320 kbps (44.1 kHz stereo) MP3s, and stamps them with strictly compliant **ID3v2.3 (UTF-16)** metadata and optimized **500x500 JPEG** cover art.

Engineered specifically for:
- **Apple iPod nano (7th Generation, 2015)**: Full iTunes / Apple Music sync compatibility without UI freeze, missing art, or garbled character encoding.
- **Google Pixel 10 Pro & modern Androids**: Zero-friction playback in VLC, Poweramp, Musicolet, Symfonium, etc.
- **iOS / modern Apple devices**: AirDrop, Finder sync, and Apple Music library integration.

---

## 1. Prerequisites

### Install FFmpeg
`ffmpeg` is required to encode the downloaded audio into pristine 320 kbps MP3.

- **macOS (via Homebrew)**:
  ```bash
  brew install ffmpeg
  ```
- **Windows**:
  - **Option A (Built-in Windows Package Manager — No extra tools needed)**:
    Open PowerShell or Terminal and run:
    ```powershell
    winget install Gyan.FFmpeg
    ```
  - **Option B (PowerShell One-Liner — downloads & extracts directly to your user folder)**:
    ```powershell
    Invoke-WebRequest -Uri "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -OutFile "$env:TEMP\ffmpeg.zip"; Expand-Archive "$env:TEMP\ffmpeg.zip" -DestinationPath "$HOME\ffmpeg" -Force; [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$HOME\ffmpeg\ffmpeg-7.1-essentials_build\bin", [EnvironmentVariableTarget]::User)
    ```
  - **Option C (Manual ZIP download from official build distributor)**:
    1. Download the latest `ffmpeg-release-essentials.zip` from **[gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/)** or **[BtbN (GitHub)](https://github.com/BtbN/FFmpeg-Builds/releases)**.
    2. Unzip the folder (e.g. to `C:\ffmpeg`).
    3. Add `C:\ffmpeg\bin` to your Windows System/User Environment Variables under **Path**.
- **Ubuntu / Debian / Linux**:
  ```bash
  sudo apt update && sudo apt install -y ffmpeg
  ```
Verify your installation:
```bash
ffmpeg -version
```

---

## 2. Spotify Access (Zero Credentials / No Premium Required!)

**Good news:** You do **not** need Spotify Premium or even Spotify Developer credentials!
Spotify recently restricted their Developer API to paid Premium subscribers (returning `HTTP 403: Active premium subscription required for the owner of the app`).

To solve this completely, `spotify_to_ipod.py` includes **Direct Public Playlist Extraction**:
- Simply run the script with any public Spotify playlist URL.
- No Spotify Developer signup, no redirect URIs, and no Spotify Premium required!

*(Optional)* If you have an active Spotify Premium account and wish to use the official Web API, you can still register an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and export `SPOTIPY_CLIENT_ID` and `SPOTIPY_CLIENT_SECRET`.

---

## 3. Installation

1. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
2. Make sure FFmpeg is installed (`winget install Gyan.FFmpeg` on Windows, or `brew install ffmpeg` on macOS).

---

## 4. Usage

### Instant Run (Zero Setup - Recommended)
Just run the script directly with your playlist link:
```bash
python spotify_to_ipod.py "https://open.spotify.com/playlist/YOUR_PLAYLIST_ID"
```

You will be asked whether you want to format for:
- **[1] Apple iPod** (nano 7th Gen / Classic / Mini) - Strict ID3v2.3, 500x500 art, 44.1kHz CBR MP3
- **[2] Modern Flagship Phone** (Google Pixel 10 Pro / iPhone) - Max Hi-Fi 320kbps 48kHz, ID3v2.4, Full-Res art

Or specify it directly in the command:
```bash
# Apple iPod nano 7th Gen
python spotify_to_ipod.py "https://open.spotify.com/playlist/YOUR_PLAYLIST_ID" --target ipod

# Google Pixel 10 Pro / Modern Smartphone
python spotify_to_ipod.py "https://open.spotify.com/playlist/YOUR_PLAYLIST_ID" --target modern
```

### Option B: Pass Credentials via CLI Flags
```bash
python spotify_to_ipod.py "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" \
  --client-id "your_spotify_client_id" \
  --client-secret "your_spotify_client_secret"
```

### Additional Options:
```bash
# Specify custom output folder
python spotify_to_ipod.py "https://open.spotify.com/playlist/..." -o "/path/to/Music"

# Force re-download even if files already exist
python spotify_to_ipod.py "https://open.spotify.com/playlist/..." --overwrite
```

### Automatic Audio Equivalent Matcher
If a specific YouTube upload or YouTube Music topic track is unavailable, region-locked, or deleted (e.g. `This video is not available` on tracks like *Strange Days Ahead* or *March of the Resistance*):
- The script automatically catches the unavailable video without terminating.
- It explores alternative candidate uploads (movie soundtrack releases, studio audio uploads, and score versions).
- It verifies candidate duration against the Spotify metadata to ensure it's not a short teaser or 10-hour loop.
- It seamlessly converts the best working audio equivalent to pristine 320 kbps MP3 and applies your tags!

### Large Playlists (394+ Tracks)
`spotify_to_ipod.py` is built to easily handle large playlists containing hundreds of songs (e.g. **394 tracks**):

- **Automatic Resume & Skip**: If you stop the download or run it in batches, the script automatically skips tracks that have already finished downloading, so you never have to re-download.
- **Direct File Input (.csv / .txt)**:
  If you have a large playlist with 394+ tracks, you can export it with 1 click using [Exportify](https://exportify.net) (free, open source) into a `.csv` file, then run:
  ```bash
  python spotify_to_ipod.py "Skwkes.csv" --target ipod
  ```
  The script will read all 394 tracks from the CSV, search and download each track at 320 kbps, resize album art for the iPod, and embed compliant ID3v2.3 tags!
- **Text File Lists**: You can also pass a plain `.txt` file containing songs (one per line, e.g. `Artist - Title`):
  ```bash
  python spotify_to_ipod.py "my_songs.txt" --target ipod
  ```

---

## 5. Why the iPod nano 7th Gen Constraints Matter

The 7th Generation iPod nano (released 2012, refreshed 2015) runs a proprietary Apple embedded OS on limited RAM with strict firmware rules:

| Constraint | Why It Is Enforced in This Script |
|---|---|
| **ID3v2.3 (Not ID3v2.4)** | iPod nano firmware was built for ID3v2.3. ID3v2.4 tags often appear blank or cause songs to list under "Unknown Artist". |
| **UTF-16 Text Encoding** | ID3v2.3 does not officially support UTF-8 (`encoding=3`). UTF-16 with BOM ensures accented letters, Japanese/Chinese glyphs, and special characters render cleanly. |
| **500x500 JPEG Cover Art** | High-res Spotify images (640x640+ or progressive JPEGs) choke the iPod nano's tiny memory buffer, causing Cover Flow / album grid lag or black squares. Pillow resizes each image to a crisp 500x500 baseline JPEG. |
| **320 kbps @ 44.1 kHz Stereo** | Maximum hardware quality supported without DSP resampling artifacts. |
| **FAT32-Safe Naming** | iPods format their flash storage in FAT32. Forbidden characters (`\ / : * ? " < > |`) and trailing periods are stripped. |
| **Resume & Skip** | Re-running the script will check `os.path.exists()` and skip already completed songs, allowing seamless resumption of large playlists. |

---

## 6. How to Sync to Your Devices

### Apple iPod nano (7th Generation)
1. Open **Apple Music** (macOS Catalina and newer) or **iTunes** (Windows).
2. Go to **File > Add to Library...** and select the downloaded playlist folder.
3. Plug in your iPod nano 7th Gen with the Lightning cable.
4. In Finder (macOS) or iTunes (Windows), select the iPod nano icon.
5. Under **Music**, check **Sync Music** and choose the playlist.
6. Click **Apply / Sync**. Album art and song order will appear immediately on your iPod!

### Google Pixel 10 Pro & Modern Android
- **Via USB Cable**: Plug into your PC/Mac with USB-C, choose **File Transfer / Android Auto**, and drag the folder into the `Music/` directory.
- **Wireless**: Send via **Quick Share** (Windows / Android) or **LocalSend**.
- Plays natively with any audio app (VLC, Poweramp, Musicolet, Retro Music Player).
