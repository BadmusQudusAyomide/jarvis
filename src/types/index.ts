export type Message = { 
  role: 'you' | 'jarvis'; 
  text: string; 
  special?: 'birthday' 
}

export type ConfettiPiece = {
  left: number; 
  delay: number; 
  duration: number; 
  color: string; 
  size: number; 
  rotation: number; 
  shape: 'square' | 'circle'
}

export type ThemeName = 'cyber' | 'minimal' | 'matrix'

export type ThemeConfig = { 
  bg: string; 
  primary: string; 
  accent: string; 
  card: string; 
  glow: string 
}

export type VoiceSettings = {
  rate: number;
  pitch: number;
  volume: number;
}

export type SessionStats = {
  commands: number;
  startTime: number;
}
