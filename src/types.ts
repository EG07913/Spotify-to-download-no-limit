export interface TrackSimulationInput {
  playlistName: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  trackNumber: number;
  totalTracks: number;
  coverUrl: string;
}

export interface ID3Frame {
  tag: string;
  name: string;
  encoding: string;
  value: string;
  note: string;
}

export type DeviceProfile = 'ipod' | 'modern';

export type ActiveTab = 'overview' | 'simulator' | 'script' | 'guide' | 'hardware';
