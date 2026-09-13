export const REQUIREMENTS_TXT = `# Core audio extraction, image processing, and ID3 tagging
yt-dlp>=2024.08.06
mutagen>=1.47.0
Pillow>=10.0.0
requests>=2.31.0
spotipy>=2.23.0
python-dotenv>=1.0.0
`;

export const PYTHON_SCRIPT = `#!/usr/bin/env python3
"""
Spotify to iPod & Modern Device Audio Generator
===============================================
Downloads tracks from a public Spotify playlist, converts them to highest-fidelity audio,
and tags them with optimized metadata tailored for either:
  1. iPod Mode (--target ipod):
     - Apple iPod nano (7th Gen, 2015), Classic, Mini & legacy players
     - 320 kbps MP3 CBR @ 44.1 kHz 16-bit stereo (Cirrus Logic low-power DAC optimized)
     - Strict ID3v2.3 tag standard with UTF-16 (BOM) text encoding
     - Pillow Lanczos downsampling to 500x500 baseline RGB JPEG (prevents RAM panics & lag)
     - Strict FAT32 sanitized filenames (60 chars max, no forbidden chars)
     - TYER 4-digit year & TRCK "X/Y" track indexing

  2. Modern Device Mode (--target modern):
     - Google Pixel 10 Pro, Samsung Galaxy S25/S26, modern Android & iPhone 15/16/17+
     - Max available source quality: 320 kbps MP3 (-b:a 320k -q:a 0) or unconstrained VBR/CBR
     - ID3v2.4 specification with native UTF-8 encoding
     - Full high-resolution album artwork (original up to 1400x1400 / 3000x3000px, 95% quality JPEG)
     - Extended modern ID3 tags: TDRC (full release date YYYY-MM-DD), TSSE (encoder info),
       full artist/album naming without truncation.
"""
from __future__ import annotations

import argparse
import base64
import csv
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Any, Dict, List, Optional
import urllib.request
from urllib.parse import urlparse

# Optional dotenv support for loading credentials from .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Check required dependencies gracefully
MISSING_DEPS: List[str] = []

try:
    import requests
except ImportError:
    MISSING_DEPS.append("requests")

try:
    from PIL import Image
except ImportError:
    MISSING_DEPS.append("Pillow")

HAVE_SPOTIPY = False
try:
    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
    HAVE_SPOTIPY = True
except ImportError:
    pass

try:
    import yt_dlp
except ImportError:
    MISSING_DEPS.append("yt-dlp")

try:
    from mutagen.id3 import (
        APIC,
        ID3,
        ID3NoHeaderError,
        TALB,
        TDRC,
        TIT2,
        TPE1,
        TRCK,
        TSSE,
        TYER,
        Encoding,
    )
    from mutagen.mp3 import MP3
except ImportError:
    MISSING_DEPS.append("mutagen")


def find_ffmpeg_binary() -> Optional[str]:
    """Find FFmpeg binary on system PATH or common winget/local installation directories on Windows."""
    # 1. Standard PATH lookup
    path_bin = shutil.which("ffmpeg")
    if path_bin:
        return path_bin

    # 2. On Windows, check standard Winget package directory locations
    if sys.platform.startswith("win"):
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        user_profile = os.environ.get("USERPROFILE", "")
        program_files = os.environ.get("ProgramFiles", "C:\\\\Program Files")
        
        possible_patterns = [
            # Standard Winget links directory
            os.path.join(local_app_data, "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
            # Winget package subdirectories
            os.path.join(local_app_data, "Microsoft", "WinGet", "Packages"),
            # Gyan.FFmpeg extracted location
            os.path.join(user_profile, "ffmpeg"),
            os.path.join("C:\\\\", "ffmpeg"),
            os.path.join(program_files, "ffmpeg"),
        ]

        for p in possible_patterns:
            if os.path.isfile(p):
                return p
            elif os.path.isdir(p):
                # Search 2 levels deep for ffmpeg.exe
                for root, _, files in os.walk(p):
                    if "ffmpeg.exe" in files:
                        return os.path.join(root, "ffmpeg.exe")
                    if root.count(os.sep) - p.count(os.sep) >= 3:
                        break

    return None


def check_ffmpeg() -> bool:
    """Verify that FFmpeg is available on system PATH or known install locations."""
    return find_ffmpeg_binary() is not None


def sanitize_filename(name: str, max_length: int = 120, strict_fat32: bool = False) -> str:
    """
    Sanitize strings for disk storage.
    If strict_fat32 is True (iPod nano mode), removes all FAT32 forbidden characters: \\\\ / : * ? " < > |
    and caps length to avoid FAT32 255-character path limits.
    """
    # Remove filesystem illegal characters across all platforms
    sanitized = re.sub(r'[\\x00-\\x1f\\\\/:*?"<>|]', '', name)
    sanitized = re.sub(r'\\s+', ' ', sanitized).strip()
    sanitized = sanitized.strip('. ')
    if not sanitized:
        sanitized = "untitled"
    return sanitized[:max_length]


def parse_playlist_id(url_or_id: str) -> str:
    """Extracts the playlist ID from Spotify URLs, URIs, or plain IDs."""
    cleaned = url_or_id.strip()
    if cleaned.startswith("spotify:playlist:"):
        return cleaned.split(":")[-1]
    
    if "open.spotify.com" in cleaned:
        parsed = urlparse(cleaned)
        path_parts = [p for p in parsed.path.split("/") if p]
        if "playlist" in path_parts:
            idx = path_parts.index("playlist")
            if idx + 1 < len(path_parts):
                return path_parts[idx + 1]
    
    return cleaned.split("?")[0].split("&")[0]


def fetch_playlist_metadata(sp: spotipy.Spotify, playlist_id: str) -> Dict[str, Any]:
    """Fetches full playlist metadata and handles pagination for all tracks."""
    print(f"[*] Fetching playlist information from Spotify (ID: {playlist_id})...")
    try:
        playlist = sp.playlist(playlist_id, fields="name,description,tracks.total")
    except Exception as e:
        raise RuntimeError(f"Failed to access playlist. Ensure playlist is public and ID is valid. Error: {e}")

    playlist_name = playlist.get("name") or "Spotify Playlist"
    total_tracks_count = playlist.get("tracks", {}).get("total", 0)
    print(f"[*] Found playlist: \\"{playlist_name}\\" ({total_tracks_count} tracks reported)")

    results = sp.playlist_items(
        playlist_id,
        fields="items(track(name,artists(name),album(name,release_date,images),track_number,duration_ms,id)),next",
        additional_types=["track"]
    )
    
    tracks: List[Dict[str, Any]] = []
    page = 1
    while results:
        for item in results.get("items", []):
            track = item.get("track")
            if not track or not track.get("name"):
                continue
            
            title = track["name"]
            artists = ", ".join([a["name"] for a in track.get("artists", [])]) or "Unknown Artist"
            album = track.get("album", {}).get("name") or "Unknown Album"
            release_date = track.get("album", {}).get("release_date") or ""
            year = release_date.split("-")[0] if release_date else ""
            track_num = track.get("track_number", len(tracks) + 1)
            
            images = track.get("album", {}).get("images", [])
            cover_url = images[0]["url"] if images else None

            tracks.append({
                "title": title,
                "artists": artists,
                "album": album,
                "year": year,
                "release_date": release_date,
                "track_number": track_num,
                "cover_url": cover_url,
                "duration_ms": track.get("duration_ms", 0),
            })

        if results.get("next"):
            results = sp.next(results)
            page += 1
        else:
            results = None

    print(f"[*] Successfully loaded {len(tracks)} tracks.")
    return {
        "name": playlist_name,
        "tracks": tracks
    }


def fetch_public_playlist_direct(playlist_id: str) -> Dict[str, Any]:
    """
    Directly extracts playlist metadata and tracks from Spotify public web embeds and HTML data.
    Requires NO Spotify Developer credentials, NO API registration, and NO Spotify Premium subscription!
    """
    print(f"[*] Extracting playlist metadata directly via Spotify public web interface...")
    print("    (No Spotify Developer keys or Spotify Premium subscription needed!)")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    embed_url = f"https://open.spotify.com/embed/playlist/{playlist_id}"
    req = urllib.request.Request(embed_url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            embed_html = resp.read().decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Failed to access Spotify public embed: {e}")

    matches = re.findall(r"<script id=\\"__NEXT_DATA__\\"[^>]*>(.*?)</script>", embed_html, re.DOTALL)
    if not matches:
        raise RuntimeError("Could not locate playlist data in Spotify public embed.")
    
    data = json.loads(matches[0])
    entity = data.get("props", {}).get("pageProps", {}).get("state", {}).get("data", {}).get("entity", {})
    playlist_name = entity.get("title") or entity.get("name") or "Spotify Playlist"
    track_list = entity.get("trackList", [])

    # High-res playlist cover
    default_cover = None
    images = entity.get("visualIdentity", {}).get("image", [])
    if images:
        default_cover = sorted(images, key=lambda x: x.get("maxWidth", 0), reverse=True)[0].get("url")
    if not default_cover and entity.get("coverArt", {}).get("sources"):
        default_cover = entity["coverArt"]["sources"][0].get("url")

    # Try fetching main playlist page for deeper album names and individual track album art
    album_map: Dict[str, Dict[str, Any]] = {}
    try:
        main_url = f"https://open.spotify.com/playlist/{playlist_id}"
        mreq = urllib.request.Request(main_url, headers=headers)
        with urllib.request.urlopen(mreq, timeout=12) as mresp:
            mhtml = mresp.read().decode("utf-8")
        sm = re.search(r"<script[^>]*id=\\"initialState\\"[^>]*>(.*?)</script>", mhtml, re.DOTALL)
        if sm:
            mdata = json.loads(base64.b64decode(sm.group(1).strip()).decode("utf-8"))
            for k, pdata in mdata.get("entities", {}).get("items", {}).items():
                if playlist_id in k and isinstance(pdata, dict):
                    for item in pdata.get("content", {}).get("items", []):
                        track_obj = item.get("itemV2", {}).get("data", {})
                        t_uri = track_obj.get("uri")
                        if t_uri:
                            album_info = track_obj.get("albumOfTrack", {})
                            c_sources = album_info.get("coverArt", {}).get("sources", [])
                            best_art = c_sources[-1].get("url") if c_sources else None
                            album_map[t_uri] = {
                                "album": album_info.get("name"),
                                "cover_url": best_art
                            }
    except Exception:
        pass

    tracks: List[Dict[str, Any]] = []
    for idx, t in enumerate(track_list, start=1):
        uri = t.get("uri", "")
        title = t.get("title", "").strip()
        artists = t.get("subtitle", "").strip() or "Unknown Artist"
        extra = album_map.get(uri, {})
        album = extra.get("album") or playlist_name
        cover_url = extra.get("cover_url") or default_cover
        
        tracks.append({
            "title": title,
            "artists": artists,
            "album": album,
            "year": "",
            "release_date": "",
            "track_number": idx,
            "cover_url": cover_url,
            "duration_ms": t.get("duration", 0),
        })

    # If the initial embed returned 100 tracks, this is likely a large playlist (e.g. 300+ tracks).
    # We attempt to paginate through remaining tracks using the anonymous session token from the embed.
    session_token = data.get("props", {}).get("pageProps", {}).get("state", {}).get("settings", {}).get("session", {}).get("accessToken")
    if len(tracks) >= 100 and session_token:
        print(f"[*] Initial 100 tracks retrieved. Attempting to fetch remaining tracks via Spotify session token...")
        offset = len(tracks)
        while True:
            api_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?offset={offset}&limit=100"
            areq = urllib.request.Request(api_url, headers={
                "Authorization": f"Bearer {session_token}",
                "User-Agent": headers["User-Agent"],
                "Accept": "application/json"
            })
            try:
                with urllib.request.urlopen(areq, timeout=12) as aresp:
                    adata = json.loads(aresp.read().decode("utf-8"))
                    items = adata.get("items", [])
                    if not items:
                        break
                    for item in items:
                        track = item.get("track")
                        if not track:
                            continue
                        t_title = track.get("name", "").strip()
                        t_artists = ", ".join(a.get("name", "") for a in track.get("artists", []))
                        t_album = track.get("album", {}).get("name", playlist_name)
                        t_images = track.get("album", {}).get("images", [])
                        t_cover = t_images[0]["url"] if t_images else default_cover
                        t_year = ""
                        r_date = track.get("album", {}).get("release_date", "")
                        if r_date and len(r_date) >= 4:
                            t_year = r_date[:4]
                        tracks.append({
                            "title": t_title,
                            "artists": t_artists,
                            "album": t_album,
                            "year": t_year,
                            "release_date": r_date,
                            "track_number": len(tracks) + 1,
                            "cover_url": t_cover,
                            "duration_ms": track.get("duration_ms", 0),
                        })
                    print(f"    --> Fetched batch: {len(tracks)} total tracks loaded so far...")
                    offset += len(items)
                    if not adata.get("next") or len(items) < 100:
                        break
            except Exception:
                # If rate-limited or unavailable, gracefully proceed with all tracks collected
                break

    print(f"[*] Found playlist: \\"{playlist_name}\\" ({len(tracks)} tracks loaded)")
    if len(tracks) == 100:
        print("\\n[i] Note for large playlists (>100 tracks):")
        print("    Spotify's public web embed delivers the first 100 tracks.")
        print("    To download all 394 tracks without limitations, you can either:")
        print("      1) Export the playlist to a CSV in 2 seconds at https://exportify.net (Free, 1-click)")
        print(f"         and run: python spotify_to_ipod.py \\"{playlist_name}.csv\\" --target ipod")
        print("      2) Or supply Spotify API credentials (--client-id / --client-secret)\\n")

    return {
        "name": playlist_name,
        "tracks": tracks
    }


def find_playlist_file(file_path: str) -> Optional[str]:
    """
    Finds a playlist file even if the user typed just the filename (e.g. 'Skwkes.csv')
    while the file was saved in their Downloads folder, parent directory, or Desktop.
    """
    clean_path = file_path.strip("\\"' \\t")
    if os.path.isfile(clean_path):
        return os.path.abspath(clean_path)

    basename = os.path.basename(clean_path)
    base_stem = os.path.splitext(basename)[0].lower()

    # Search candidates in likely directories
    search_dirs = [
        os.getcwd(),
        os.path.abspath(".."),
        os.path.expanduser("~/Downloads"),
        os.path.expanduser("~/Desktop"),
        os.path.join(os.getcwd(), "downloads"),
    ]

    # Direct filename match in directories
    for d in search_dirs:
        if not os.path.isdir(d):
            continue
        candidate = os.path.join(d, basename)
        if os.path.isfile(candidate):
            return os.path.abspath(candidate)

    # Fuzzy match (e.g. 'Skwkes (1).csv', 'Skwkes.csv', case differences)
    for d in search_dirs:
        if not os.path.isdir(d):
            continue
        try:
            for fname in os.listdir(d):
                if fname.lower().endswith((".csv", ".tsv", ".txt")):
                    fstem = os.path.splitext(fname)[0].lower()
                    if base_stem and (base_stem == fstem or base_stem in fstem or fstem in base_stem):
                        match_path = os.path.join(d, fname)
                        if os.path.isfile(match_path):
                            return os.path.abspath(match_path)
        except OSError:
            continue

    return None


def load_tracks_from_file(file_path: str) -> Dict[str, Any]:
    """
    Loads playlist tracks directly from a local CSV, TSV, or TXT file.
    Ideal for large playlists (394+ tracks) exported from Spotify via Exportify (https://exportify.net),
    Soundiiz, TuneMyMusic, or plain text tracklists.
    """
    tracks: List[Dict[str, Any]] = []
    
    resolved_path = find_playlist_file(file_path)
    if not resolved_path:
        curr_dir = os.getcwd()
        parent_dir = os.path.abspath("..")
        downloads_dir = os.path.expanduser("~/Downloads")
        raise FileNotFoundError(
            f"Could not locate '{file_path}'.\\n"
            f"    Searched in:\\n"
            f"      - Current folder: {curr_dir}\\n"
            f"      - Parent folder:  {parent_dir}\\n"
            f"      - Downloads:      {downloads_dir}\\n"
            f"    --> Tip: Drag and drop the CSV file directly onto this terminal window,\\n"
            f"        move '{os.path.basename(file_path)}' into this folder, or paste the Spotify playlist URL!"
        )

    base_name = os.path.splitext(os.path.basename(resolved_path))[0]
    ext = os.path.splitext(resolved_path)[1].lower()

    if ext in [".csv", ".tsv"]:
        delimiter = "\\t" if ext == ".tsv" else ","
        with open(resolved_path, "r", encoding="utf-8-sig", errors="ignore") as f:
            reader = csv.DictReader(f, delimiter=delimiter)
            for i, row in enumerate(reader, 1):
                title = (
                    row.get("Track Name") or row.get("track_name") or 
                    row.get("Title") or row.get("title") or 
                    row.get("Name") or row.get("name") or ""
                ).strip()
                artists = (
                    row.get("Artist Name(s)") or row.get("artist_name") or 
                    row.get("Artist") or row.get("artist") or 
                    row.get("Artists") or row.get("artists") or "Unknown Artist"
                ).strip()
                album = (
                    row.get("Album Name") or row.get("album_name") or 
                    row.get("Album") or row.get("album") or base_name
                ).strip()
                r_date = (row.get("Release Date") or row.get("release_date") or "").strip()
                year = r_date[:4] if len(r_date) >= 4 else ""
                
                if title:
                    tracks.append({
                        "title": title,
                        "artists": artists,
                        "album": album,
                        "year": year,
                        "release_date": r_date,
                        "track_number": i,
                        "cover_url": None,
                        "duration_ms": 0,
                    })
    elif ext in [".txt", ".m3u", ".m3u8"]:
        with open(resolved_path, "r", encoding="utf-8-sig", errors="ignore") as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
        for i, line in enumerate(lines, 1):
            if " - " in line:
                parts = line.split(" - ", 1)
                artists, title = parts[0].strip(), parts[1].strip()
            elif " by " in line.lower():
                parts = re.split(r"\\s+by\\s+", line, flags=re.IGNORECASE, maxsplit=1)
                title, artists = parts[0].strip(), parts[1].strip()
            else:
                title, artists = line, "Unknown Artist"
            tracks.append({
                "title": title,
                "artists": artists,
                "album": base_name,
                "year": "",
                "release_date": "",
                "track_number": i,
                "cover_url": None,
                "duration_ms": 0,
            })
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Please use .csv, .tsv, or .txt.")

    print(f"[*] Successfully loaded {len(tracks)} tracks from: \\"{os.path.basename(resolved_path)}\\"")
    if resolved_path != os.path.abspath(file_path):
        print(f"    (File located at: {resolved_path})")
    return {
        "name": base_name,
        "tracks": tracks
    }


def download_and_optimize_cover_art(url: Optional[str], target: str = "ipod") -> Optional[bytes]:
    """
    Downloads and processes cover art based on device target:
      - iPod mode ('ipod'):
          Downsampled to strictly 500x500 pixels baseline RGB JPEG (quality 88).
          Removes progressive scans, CMYK profiles, and alpha channels that freeze iPod nano 7th Gen.
      - Modern mode ('modern'):
          Retains pristine full high-resolution image (up to 1400x1400 / 3000x3000px).
          High-fidelity JPEG output (quality 95) with vibrant color gamut for OLED displays (Pixel 10 Pro).
    """
    if not url:
        return None

    try:
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        
        with Image.open(io.BytesIO(resp.content)) as img:
            rgb_img = img.convert("RGB")
            out_buffer = io.BytesIO()

            if target == "ipod":
                # Strict 500x500 baseline JPEG for iPod nano 7th Gen 64MB RAM constraint
                resized_img = rgb_img.resize((500, 500), Image.Resampling.LANCZOS)
                resized_img.save(
                    out_buffer,
                    format="JPEG",
                    quality=88,
                    optimize=True,
                    progressive=False
                )
            else:
                # Modern Device Mode: Keep full max resolution, 95% high-quality compression
                # If artwork is exceedingly oversized (> 1400px), Lanczos downscale to 1400 for optimal tag size
                width, height = rgb_img.size
                if max(width, height) > 1400:
                    scale = 1400 / max(width, height)
                    new_size = (int(width * scale), int(height * scale))
                    rgb_img = rgb_img.resize(new_size, Image.Resampling.LANCZOS)

                rgb_img.save(
                    out_buffer,
                    format="JPEG",
                    quality=95,
                    optimize=True,
                    progressive=True
                )
            return out_buffer.getvalue()
    except Exception as e:
        print(f"    [!] Warning: Failed to process cover art ({e}). Continuing without image.")
        return None


class YDLErrorLogger:
    """
    Captures yt-dlp internal messages cleanly.
    Suppresses raw red stderr dump when a video is unavailable so we can
    gracefully inform the user and switch to an equivalent audio source.
    """
    def __init__(self):
        self.last_error = ""
        self.errors = []

    def debug(self, msg: str):
        pass

    def warning(self, msg: str):
        pass

    def error(self, msg: str):
        cleaned = msg.strip()
        if cleaned.startswith("ERROR: "):
            cleaned = cleaned[7:]
        self.last_error = cleaned
        self.errors.append(cleaned)


def clean_track_title(title: str) -> str:
    """
    Strips soundtrack tags, remastered annotations, and deluxe markers
    to construct cleaner search queries when primary searches fail.
    """
    cleaned = title
    cleaned = re.sub(r"\\s*[-–—]\\s*(from\\b|soundtrack|remastered|remaster|bonus track|deluxe|mono|stereo|anniversary|ost).*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\\s*\\((from\\b|soundtrack|remastered|remaster|bonus track|deluxe|mono|stereo|anniversary|ost|feat\\.|official).*?\\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\\s*\\[(from\\b|soundtrack|remastered|remaster|bonus track|deluxe|mono|stereo|anniversary|ost|feat\\.|official).*?\\]", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned if cleaned else title


def build_search_queries(title: str, artists: str, album: str = "") -> List[str]:
    """
    Builds a progressive list of candidate search queries from high-precision
    to broad audio equivalents (including OST / soundtrack variations).
    """
    queries = []
    clean_t = clean_track_title(title)

    # 1. High-precision official audio
    queries.append(f"{title} {artists} official audio")
    queries.append(f"{title} {artists} audio")

    # 2. Cleaned title query (handles 'from "The Batman"', 'Remastered 2018', etc.)
    if clean_t.lower() != title.lower():
        queries.append(f"{clean_t} {artists} audio")
        queries.append(f"{clean_t} {artists}")

    # 3. Direct title + artist
    queries.append(f"{title} {artists}")

    # 4. Soundtrack / Album contextual queries
    if album and album.lower() not in [title.lower(), clean_t.lower(), "unknown", "unknown artist", ""]:
        clean_alb = clean_track_title(album)
        queries.append(f"{clean_t} {artists} {clean_alb}")
        queries.append(f"{clean_t} {clean_alb} soundtrack")

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for q in queries:
        q_norm = " ".join(q.split()).lower()
        if q_norm not in seen:
            seen.add(q_norm)
            deduped.append(" ".join(q.split()))
    return deduped


def download_track_audio(
    title: str,
    artists: str,
    output_mp3_path: str,
    target: str = "ipod",
    duration_ms: int = 0,
    album: str = ""
) -> bool:
    """
    Uses yt-dlp to search and download the highest quality audio for the track.
    Features an Automatic Audio Equivalent Engine:
      - If a specific YouTube video (e.g. topic upload) is unavailable, region-locked, or deleted,
        it automatically tests alternative candidate videos and query formulations until
        a high-fidelity audio equivalent is matched and downloaded.
      - iPod mode ('ipod'):
          Strict 320 kbps CBR, 44.1 kHz sample rate, 2-channel stereo.
          (Matches iPod nano 7th Gen Cirrus Logic low-power DAC clock frequency).
      - Modern mode ('modern'):
          Max bitrate 320 kbps CBR (-b:a 320k -q:a 0), preserving 48.0 kHz native DAC rate.
    """
    temp_dir = tempfile.mkdtemp(prefix=f"spot_{target}_")
    temp_base = os.path.join(temp_dir, "temp_download")

    if target == "ipod":
        # Strict 44.1 kHz stereo 320 kbps CBR
        postprocessor_args = [
            "-ar", "44100",
            "-ac", "2",
            "-b:a", "320k"
        ]
    else:
        # Modern flagship phone profile: highest quality encoder pass, 48.0 kHz native DAC rate
        postprocessor_args = [
            "-ar", "48000",
            "-ac", "2",
            "-b:a", "320k",
            "-q:a", "0"
        ]

    ffmpeg_bin = find_ffmpeg_binary()
    ffmpeg_dir = os.path.dirname(ffmpeg_bin) if ffmpeg_bin else None

    logger = YDLErrorLogger()
    ydl_download_opts = {
        "format": "bestaudio/best",
        "outtmpl": f"{temp_base}.%(ext)s",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "logger": logger,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "320",
            }
        ],
        "postprocessor_args": postprocessor_args,
    }
    if ffmpeg_dir:
        ydl_download_opts["ffmpeg_location"] = ffmpeg_dir

    search_queries = build_search_queries(title, artists, album)
    tried_video_ids = set()
    attempt_count = 0

    try:
        # Pass 1: Try multiple candidate videos per search query
        for q_idx, query in enumerate(search_queries):
            search_opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": True,
                "skip_download": True,
                "noplaylist": True,
                "ignoreerrors": True,
                "logger": logger,
            }
            if ffmpeg_dir:
                search_opts["ffmpeg_location"] = ffmpeg_dir

            candidates = []
            try:
                with yt_dlp.YoutubeDL(search_opts) as ydl_search:
                    search_res = ydl_search.extract_info(f"ytsearch5:{query}", download=False)
                    if search_res and "entries" in search_res:
                        for entry in search_res.get("entries") or []:
                            if entry and (entry.get("id") or entry.get("url")):
                                candidates.append(entry)
            except Exception:
                candidates = []

            # If flat search yielded candidates, try each viable candidate
            for cand in candidates:
                cand_id = cand.get("id") or cand.get("url")
                if not cand_id or cand_id in tried_video_ids:
                    continue

                cand_title = cand.get("title") or "Candidate Audio"
                cand_lower = cand_title.lower()
                title_lower = title.lower()

                # Filter out noisy non-music types (unless requested in the song title itself)
                banned_keywords = [
                    "reaction", "how to play", "guitar tutorial", "piano tutorial",
                    "synthesia", "karaoke version", "instrumental cover", "review",
                    "unboxing", "10 hour", "1 hour loop"
                ]
                if any(b in cand_lower and b not in title_lower for b in banned_keywords):
                    tried_video_ids.add(cand_id)
                    continue

                # Filter candidate duration if duration from Spotify is known
                if duration_ms > 0:
                    cand_dur = cand.get("duration")
                    target_s = duration_ms / 1000
                    if cand_dur and cand_dur > 0 and target_s > 15:
                        diff = abs(cand_dur - target_s)
                        if diff > 75 and (diff / target_s) > 0.40:
                            # Significant duration mismatch (e.g. preview or compilation)
                            tried_video_ids.add(cand_id)
                            continue

                # Attempt download of this candidate
                attempt_count += 1
                cand_url = f"https://www.youtube.com/watch?v={cand_id}" if len(cand_id) == 11 else cand_id

                # Clean any lingering temp files
                for f in os.listdir(temp_dir):
                    try:
                        os.remove(os.path.join(temp_dir, f))
                    except OSError:
                        pass

                try:
                    with yt_dlp.YoutubeDL(ydl_download_opts) as ydl_dl:
                        ydl_dl.download([cand_url])

                    expected_mp3 = f"{temp_base}.mp3"
                    if os.path.exists(expected_mp3) and os.path.getsize(expected_mp3) > 30000:
                        shutil.move(expected_mp3, output_mp3_path)
                        if attempt_count > 1:
                            print(f"    --> Matched audio equivalent: \\"{cand_title}\\"")
                        return True
                    else:
                        tried_video_ids.add(cand_id)
                except Exception as e:
                    tried_video_ids.add(cand_id)
                    err_hint = logger.last_error or str(e)
                    if "not available" in err_hint.lower() or "unavailable" in err_hint.lower():
                        print(f"    [i] Video unavailable ({cand_id}). Searching for audio equivalent...")
                    elif "private" in err_hint.lower() or "blocked" in err_hint.lower():
                        print(f"    [i] Video restricted. Trying alternative audio equivalent...")

            # Pass 2 Fallback: If candidate extraction did not yield working audio,
            # try direct ytsearch1 on the current query as a fallback
            try:
                for f in os.listdir(temp_dir):
                    try:
                        os.remove(os.path.join(temp_dir, f))
                    except OSError:
                        pass

                with yt_dlp.YoutubeDL(ydl_download_opts) as ydl_dl:
                    ydl_dl.download([f"ytsearch1:{query}"])

                expected_mp3 = f"{temp_base}.mp3"
                if os.path.exists(expected_mp3) and os.path.getsize(expected_mp3) > 30000:
                    shutil.move(expected_mp3, output_mp3_path)
                    if q_idx > 0:
                        print(f"    --> Matched audio equivalent via query fallback: \\"{query}\\"")
                    return True
            except Exception:
                continue

        print(f"    [!] All audio candidate sources were unavailable for '{title} - {artists}'")
        return False
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def tag_file(
    mp3_path: str,
    title: str,
    artists: str,
    album: str,
    year: str,
    release_date: str,
    track_number: int,
    total_tracks: int,
    cover_bytes: Optional[bytes],
    target: str = "ipod"
) -> None:
    """
    Embeds metadata tailored for the chosen hardware profile:
      - iPod mode ('ipod'):
          Strict ID3v2.3 tag specification.
          Forced UTF-16 text encoding (mutagen Encoding.UTF16).
          TYER 4-digit year, TRCK "X/Y".
          500x500 JPEG APIC.
      - Modern mode ('modern'):
          ID3v2.4 tag specification.
          Native UTF-8 text encoding (mutagen Encoding.UTF8).
          TDRC full release timestamp (YYYY-MM-DD), TSSE encoder signature.
          High-resolution album art APIC.
    """
    try:
        try:
            tags = ID3(mp3_path)
            tags.delete()  # Clear existing/partial tags
        except ID3NoHeaderError:
            pass

        tags = ID3()

        if target == "ipod":
            # iPod nano 7th Gen strictly requires UTF-16 in ID3v2.3
            enc = Encoding.UTF16
            tags.add(TIT2(encoding=enc, text=[title]))
            tags.add(TPE1(encoding=enc, text=[artists]))
            tags.add(TALB(encoding=enc, text=[album]))
            if year:
                tags.add(TYER(encoding=enc, text=[str(year)]))
            
            track_str = f"{track_number}/{total_tracks}" if total_tracks else str(track_number)
            tags.add(TRCK(encoding=enc, text=[track_str]))

            if cover_bytes:
                tags.add(APIC(
                    encoding=enc,
                    mime="image/jpeg",
                    type=3,  # Front cover
                    desc="Cover",
                    data=cover_bytes
                ))

            # Force save strictly as ID3v2.3 (v2_version=3)
            tags.save(mp3_path, v2_version=3, v23_sep="/")

        else:
            # Modern Mode: Full ID3v2.4 with UTF-8 & extended frames
            enc = Encoding.UTF8
            tags.add(TIT2(encoding=enc, text=[title]))
            tags.add(TPE1(encoding=enc, text=[artists]))
            tags.add(TALB(encoding=enc, text=[album]))
            
            # Full ISO release date if available
            date_val = release_date if release_date else str(year)
            if date_val:
                tags.add(TDRC(encoding=enc, text=[date_val]))

            track_str = f"{track_number}/{total_tracks}" if total_tracks else str(track_number)
            tags.add(TRCK(encoding=enc, text=[track_str]))
            tags.add(TSSE(encoding=enc, text=["FFmpeg LAME 320kbps (Modern Hi-Fi)"]))

            if cover_bytes:
                tags.add(APIC(
                    encoding=enc,
                    mime="image/jpeg",
                    type=3,
                    desc="Cover",
                    data=cover_bytes
                ))

            # Save as standard ID3v2.4 (v2_version=4)
            tags.save(mp3_path, v2_version=4)

    except Exception as e:
        print(f"    [!] Warning: Failed to apply ID3 metadata: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert Spotify playlists into audiophile MP3s tailored for Apple iPod or Modern Flagship Devices (Google Pixel 10 Pro / iPhone)."
    )
    parser.add_argument(
        "playlist",
        nargs="?",
        help="Spotify playlist URL, URI, or ID (e.g., https://open.spotify.com/playlist/...)"
    )
    parser.add_argument(
        "--target", "-t",
        choices=["ipod", "modern"],
        default=None,
        help="Target device profile: 'ipod' (strict ID3v2.3, 500x500 art, 44.1kHz) or 'modern' (max quality, ID3v2.4, full-res art, 48kHz)"
    )
    parser.add_argument(
        "--client-id",
        default=os.environ.get("SPOTIPY_CLIENT_ID"),
        help="Spotify Developer Client ID (can also set SPOTIPY_CLIENT_ID env var)"
    )
    parser.add_argument(
        "--client-secret",
        default=os.environ.get("SPOTIPY_CLIENT_SECRET"),
        help="Spotify Developer Client Secret (can also set SPOTIPY_CLIENT_SECRET env var)"
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="./downloads",
        help="Directory to save playlists in (default: ./downloads)"
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-download files even if they already exist in the target folder"
    )

    args = parser.parse_args()

    print("=" * 72)
    print("  Spotify to iPod & Modern Device MP3 Generator")
    print("  Profile Support: Apple iPod nano (7th Gen) | Google Pixel 10 Pro / Modern")
    print("=" * 72)

    # 1. Python package checks
    if MISSING_DEPS:
        print(f"\\n[ERROR] Missing required Python packages: {', '.join(MISSING_DEPS)}", file=sys.stderr)
        print("Please install the required dependencies with pip:", file=sys.stderr)
        print("  pip install -r requirements.txt\\n", file=sys.stderr)
        sys.exit(1)

    # 2. FFmpeg check
    ffmpeg_bin = find_ffmpeg_binary()
    if not ffmpeg_bin:
        print("\\n[ERROR] FFmpeg was not found on your system PATH or standard winget directories!", file=sys.stderr)
        print("FFmpeg is required to encode audio to MP3.", file=sys.stderr)
        print("Installation instructions:", file=sys.stderr)
        print("  - macOS:   brew install ffmpeg", file=sys.stderr)
        print("  - Windows: winget install Gyan.FFmpeg   (restart your terminal after running)", file=sys.stderr)
        print("             Or download ZIP from https://www.gyan.dev/ffmpeg/builds/", file=sys.stderr)
        print("  - Ubuntu:  sudo apt update && sudo apt install -y ffmpeg\\n", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"  FFmpeg Binary: Found ({ffmpeg_bin})")

    # 3. Target device selection
    target_mode = args.target
    if not target_mode:
        if sys.stdin.isatty():
            print("\\nSelect your target device profile:")
            print("  [1] Apple iPod (nano 7th Gen / Classic / Mini) - Strict ID3v2.3, 500x500 art, 44.1kHz")
            print("  [2] Modern Flagship Phone (Pixel 10 Pro / iPhone) - Max Hi-Fi, ID3v2.4, Full-Res art, 48kHz")
            choice = input("Enter choice (1 or 2, default: 1): ").strip()
            if choice == "2" or choice.lower().startswith("m"):
                target_mode = "modern"
            else:
                target_mode = "ipod"
        else:
            target_mode = "ipod"

    print(f"\\n[>] Selected Profile: {target_mode.upper()}")
    if target_mode == "ipod":
        print("    * Audio: 320 kbps CBR MP3 @ 44.1 kHz (Cirrus Logic low-power clock)")
        print("    * Metadata: Strict ID3v2.3 with UTF-16 (BOM) text encoding")
        print("    * Album Art: Downscaled to 500x500 baseline JPEG (iPod RAM safe)")
        print("    * Filenames: Sanitized for FAT32 filesystem limits")
    else:
        print("    * Audio: Max Quality 320 kbps MP3 (-q:a 0) @ 48.0 kHz (Audiophile smartphone DAC)")
        print("    * Metadata: Modern ID3v2.4 with UTF-8 encoding & full release dates")
        print("    * Album Art: Full high-resolution artwork (up to 1400x1400px, 95% quality)")
        print("    * Filenames: Full artist & title naming")

    # 4. Playlist URL prompt if not passed
    playlist_arg = args.playlist
    if not playlist_arg:
        if sys.stdin.isatty():
            playlist_arg = input("\\nEnter Spotify Playlist URL, ID, or path to .csv/.txt file: ").strip()
        if not playlist_arg:
            parser.print_help()
            sys.exit(1)

    playlist_data = None
    is_local_file = os.path.isfile(playlist_arg) or playlist_arg.lower().endswith((".csv", ".tsv", ".txt", ".m3u", ".m3u8"))

    if is_local_file:
        try:
            playlist_data = load_tracks_from_file(playlist_arg)
        except Exception as e:
            print(f"[ERROR] Could not load tracks from file '{playlist_arg}': {e}", file=sys.stderr)
            sys.exit(1)
    else:
        playlist_id = parse_playlist_id(playlist_arg)
        if not playlist_id:
            print(f"[ERROR] Could not extract Spotify playlist ID from '{playlist_arg}'", file=sys.stderr)
            sys.exit(1)

        # 5. Extract playlist tracks & metadata
        client_id = args.client_id
        client_secret = args.client_secret

        # If user provided credentials and spotipy is available, try Spotify Web API first
        if client_id and client_secret and HAVE_SPOTIPY:
            try:
                auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
                sp = spotipy.Spotify(auth_manager=auth_manager)
                playlist_data = fetch_playlist_metadata(sp, playlist_id)
            except Exception as e:
                err_msg = str(e)
                if "Active premium subscription required" in err_msg or "403" in err_msg:
                    print("\\n[!] Spotify Web API Notice: Spotify returned HTTP 403 (Active Premium subscription required for developer app owners).")
                    print("    --> Switching automatically to Direct Public Playlist Extraction (No Premium or API keys required!)...\\n")
                else:
                    print(f"\\n[!] Spotify API notice ({e}). Switching to Direct Public Playlist Extraction...\\n")
                playlist_data = None

        # Fallback to direct public web extraction (Zero keys & No Premium required)
        if not playlist_data:
            try:
                playlist_data = fetch_public_playlist_direct(playlist_id)
            except Exception as e:
                print(f"[ERROR] Failed to fetch playlist data: {e}", file=sys.stderr)
                sys.exit(1)

    playlist_name = playlist_data["name"]
    tracks = playlist_data["tracks"]
    total_tracks = len(tracks)

    if total_tracks == 0:
        print("[!] No tracks found in this playlist. Exiting.")
        sys.exit(0)

    # 8. Create dedicated playlist directory
    strict_fat32 = (target_mode == "ipod")
    sanitized_folder = sanitize_filename(playlist_name, max_length=80, strict_fat32=strict_fat32)
    playlist_dir = os.path.join(os.path.abspath(args.output_dir), sanitized_folder)
    os.makedirs(playlist_dir, exist_ok=True)
    print(f"[*] Destination directory:\\n    {playlist_dir}\\n")

    # 9. Process tracks
    successful = 0
    skipped = 0
    failed = 0
    pad_len = 2 if total_tracks < 100 else 3

    for idx, track_info in enumerate(tracks, start=1):
        title = track_info["title"]
        artists = track_info["artists"]
        album = track_info["album"]
        year = track_info["year"]
        release_date = track_info.get("release_date", "")
        cover_url = track_info["cover_url"]

        num_str = f"{idx:0{pad_len}d}"
        max_name_len = 50 if target_mode == "ipod" else 80
        clean_artist = sanitize_filename(artists, max_length=max_name_len, strict_fat32=strict_fat32)
        clean_title = sanitize_filename(title, max_length=max_name_len, strict_fat32=strict_fat32)
        filename = f"{num_str} - {clean_artist} - {clean_title}.mp3"
        dest_path = os.path.join(playlist_dir, filename)

        progress_tag = f"[{idx}/{total_tracks}]"

        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 50000 and not args.overwrite:
            print(f"{progress_tag} Skipping (already exists): {title} by {artists}")
            skipped += 1
            continue

        print(f"{progress_tag} Processing ({target_mode.upper()} mode): {title} - {artists}")

        download_ok = download_track_audio(
            title=title,
            artists=artists,
            output_mp3_path=dest_path,
            target=target_mode,
            duration_ms=track_info.get("duration_ms", 0),
            album=album
        )
        if not download_ok or not os.path.exists(dest_path):
            print(f"    [!] Failed to download audio for '{title}'")
            failed += 1
            continue

        cover_bytes = download_and_optimize_cover_art(cover_url, target=target_mode)

        tag_file(
            mp3_path=dest_path,
            title=title,
            artists=artists,
            album=album,
            year=year,
            release_date=release_date,
            track_number=idx,
            total_tracks=total_tracks,
            cover_bytes=cover_bytes,
            target=target_mode
        )

        successful += 1

    # 10. Summary & Device-Specific Sync Advice
    print("\\n" + "=" * 72)
    print("  Processing Complete!")
    print(f"  Target Device Profile: {target_mode.upper()}")
    print(f"  Total Tracks: {total_tracks}")
    print(f"  Downloaded & Tagged: {successful}")
    print(f"  Skipped (Existing): {skipped}")
    print(f"  Failed: {failed}")
    print(f"  Saved to: {playlist_dir}")
    print("=" * 72)

    if target_mode == "ipod":
        print("\\nSync Tips for Apple iPod nano (7th Gen / Classic):")
        print("  1. Drag the playlist folder into Apple Music (macOS) or iTunes (Windows).")
        print("  2. Connect your iPod via USB/Lightning cable.")
        print("  3. Sync the playlist. The 500x500 JPEG artwork and ID3v2.3 UTF-16 tags will render instantly!")
    else:
        print("\\nSync Tips for Google Pixel 10 Pro / Modern Phones:")
        print("  1. Connect your phone via USB-C (choose File Transfer / MTP) or send wirelessly via Quick Share.")
        print("  2. Drag the folder directly into your device's 'Music' directory.")
        print("  3. Open VLC, Poweramp, Musicolet, or USB Audio Player PRO for bit-perfect 48kHz audio & high-res covers.")


if __name__ == "__main__":
    main()
`;
