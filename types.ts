export interface LandmarkData {
  name: string;
  description: string;
  history: string;
  sources: { uri: string; title: string }[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  SEARCHING_HISTORY = 'SEARCHING_HISTORY',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  SHOWING_AR = 'SHOWING_AR',
  ERROR = 'ERROR'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
