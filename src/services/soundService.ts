import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';

export interface SoundTrack {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: 'rain',
    title: 'Rain on Leaves',
    subtitle: '432 Hz frequency',
    icon: 'i-water',
    url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/rain.mp3',
  },
  {
    id: 'ocean',
    title: 'Ocean Waves',
    subtitle: 'Rhythmic tide',
    icon: 'i-cloud',
    url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/ocean.mp3',
  },
  {
    id: 'birds',
    title: 'Forest Breeze',
    subtitle: 'Woodland calm',
    icon: 'i-leaf',
    url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/birds.mp3',
  },
  {
    id: 'night',
    title: 'Deep Night',
    subtitle: 'Binaural sleep',
    icon: 'i-moon',
    url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/night.mp3',
  },
];

type SoundStateListener = (state: { activeTrack: string | null }) => void;

class SoundService {
  private currentPlayer: AudioPlayer | null = null;
  private currentTrackId: string | null = null;
  private sleepTimerTimeout: any = null;
  private isConfigured: boolean = false;
  private volume: number = 0.85;
  private listeners: Set<SoundStateListener> = new Set();

  private async ensureAudioMode() {
    if (this.isConfigured) return;
    try {
      if (setAudioModeAsync) {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
      }
      this.isConfigured = true;
    } catch (e) {
      console.warn('[SoundService] Audio mode configuration warning:', e);
    }
  }

  private notify() {
    const state = { activeTrack: this.currentTrackId };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn('[SoundService] listener error:', err);
      }
    });
  }

  public addListener(listener: SoundStateListener): () => void {
    this.listeners.add(listener);
    listener({ activeTrack: this.currentTrackId });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async playTrack(trackId: string): Promise<boolean> {
    const track = SOUND_TRACKS.find((t) => t.id === trackId);
    if (!track) return false;

    await this.ensureAudioMode();

    // If already playing this track, stop it (toggle off)
    if (this.currentTrackId === trackId && this.currentPlayer) {
      await this.stop();
      return false;
    }

    try {
      if (this.currentPlayer) {
        try {
          this.currentPlayer.pause();
          this.currentPlayer.remove();
        } catch {}
        this.currentPlayer = null;
      }

      const player = createAudioPlayer({ uri: track.url });
      player.loop = true;
      player.volume = this.volume;
      player.play();

      this.currentPlayer = player;
      this.currentTrackId = trackId;
      this.notify();
      return true;
    } catch (error) {
      console.warn('[SoundService] Could not play track natively:', error);
      this.currentTrackId = trackId;
      this.notify();
      return true;
    }
  }

  public async play(trackId: string): Promise<boolean> {
    return this.playTrack(trackId);
  }

  public async setVolume(vol: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentPlayer) {
      try {
        this.currentPlayer.volume = this.volume;
      } catch (e) {
        console.warn('[SoundService] could not set volume:', e);
      }
    }
  }

  public async stop(): Promise<void> {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }

    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause();
        this.currentPlayer.remove();
      } catch {}
      this.currentPlayer = null;
    }
    this.currentTrackId = null;
    this.notify();
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public setSleepTimer(minutes: number, onTimerEnd?: () => void) {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }

    if (minutes <= 0) return;

    this.sleepTimerTimeout = setTimeout(async () => {
      await this.stop();
      if (onTimerEnd) onTimerEnd();
    }, minutes * 60 * 1000);
  }

  public setTimer(minutes: number, onTimerEnd?: () => void) {
    this.setSleepTimer(minutes, onTimerEnd);
  }
}

export const soundService = new SoundService();
