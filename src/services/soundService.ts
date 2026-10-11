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
    id: 'forest',
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

class SoundService {
  private currentPlayer: AudioPlayer | null = null;
  private currentTrackId: string | null = null;
  private sleepTimerTimeout: any = null;
  private isConfigured: boolean = false;

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
      // Clean up previous player
      if (this.currentPlayer) {
        try {
          this.currentPlayer.pause();
          this.currentPlayer.remove();
        } catch {}
        this.currentPlayer = null;
      }

      const player = createAudioPlayer({ uri: track.url });
      player.loop = true;
      player.volume = 0.85;
      player.play();

      this.currentPlayer = player;
      this.currentTrackId = trackId;
      return true;
    } catch (error) {
      console.warn('[SoundService] Could not play track natively:', error);
      // Still retain state for UI visualizer
      this.currentTrackId = trackId;
      return true;
    }
  }

  public async stop() {
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
}

export const soundService = new SoundService();
