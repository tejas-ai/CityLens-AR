import React, { useEffect, useRef, useState } from 'react';
import { LandmarkData } from '../types';

interface ARViewProps {
  imageData: string;
  landmarkData: LandmarkData;
  audioBuffer: AudioBuffer | null;
  onReset: () => void;
}

export const ARView: React.FC<ARViewProps> = ({ imageData, landmarkData, audioBuffer, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    // Auto-play audio when AR view opens
    if (audioBuffer) {
      playAudio();
    }
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBuffer]);

  const playAudio = () => {
    if (!audioBuffer) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      stopAudio(); // Stop any previous instance

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (e) {
      console.error("Audio play error", e);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Image - The "AR" Camera View */}
      <img 
        src={imageData} 
        alt="Landmark" 
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start">
        <button 
          onClick={onReset}
          className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/20 hover:bg-black/60 transition"
        >
          ← New Photo
        </button>
        <div className="bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
          Live AR Mode
        </div>
      </div>

      {/* Info Overlay Cards */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end p-4 pb-8 space-y-4 bg-gradient-to-t from-black via-black/80 to-transparent h-2/3 pointer-events-none">
        
        {/* Main Landmark Card */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto transform transition-all duration-500 ease-out translate-y-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                {landmarkData.name}
              </h1>
              <p className="text-indigo-300 text-sm mt-1">{landmarkData.description}</p>
            </div>
            
            <button 
              onClick={togglePlayback}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-indigo-500 hover:bg-indigo-600'
              } text-white shadow-lg`}
              aria-label={isPlaying ? "Stop Narration" : "Play Narration"}
            >
               {isPlaying ? (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               )}
            </button>
          </div>

          <div className={`mt-4 text-gray-200 leading-relaxed text-sm transition-all duration-300 overflow-y-auto ${showFullHistory ? 'max-h-60' : 'max-h-24'}`}>
            <p>
              {landmarkData.history}
            </p>
          </div>
          
          <button 
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="w-full mt-2 text-center text-xs text-indigo-400 font-medium hover:text-indigo-300"
          >
            {showFullHistory ? 'Show Less' : 'Read More'}
          </button>

          {/* Sources Section */}
          {landmarkData.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Sources</p>
              <div className="flex flex-wrap gap-2">
                {landmarkData.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300 transition"
                  >
                    <span className="truncate max-w-[100px]">{source.title}</span>
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
