import React, { useState, useRef, useCallback } from 'react';
import { identifyLandmark, fetchLandmarkHistory, generateNarration } from './services/geminiService';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ARView } from './components/ARView';
import { LandmarkData, AppState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageData, setImageData] = useState<string | null>(null);
  const [landmarkData, setLandmarkData] = useState<LandmarkData | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error("Failed to read file"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        setAppState(AppState.ANALYZING_IMAGE);
        const base64 = await fileToBase64(file);
        setImageData(base64);

        // Strip prefix for API
        const base64Data = base64.split(',')[1];
        const mimeType = file.type;

        // Step 1: Identify
        const identification = await identifyLandmark(base64Data, mimeType);
        
        // Step 2: Search History
        setAppState(AppState.SEARCHING_HISTORY);
        const { history, sources } = await fetchLandmarkHistory(identification.name);

        setLandmarkData({
          name: identification.name,
          description: identification.visualDescription,
          history,
          sources
        });

        // Step 3: Generate Audio
        setAppState(AppState.GENERATING_AUDIO);
        try {
            const audio = await generateNarration(history);
            setAudioBuffer(audio);
        } catch (audioErr) {
            console.warn("Audio generation failed, continuing without audio", audioErr);
            // Non-fatal error
        }

        setAppState(AppState.SHOWING_AR);

      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Something went wrong.");
        setAppState(AppState.ERROR);
      }
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setImageData(null);
    setLandmarkData(null);
    setAudioBuffer(null);
    setErrorMsg(null);
  };

  if (appState === AppState.SHOWING_AR && imageData && landmarkData) {
    return (
      <ARView 
        imageData={imageData} 
        landmarkData={landmarkData} 
        audioBuffer={audioBuffer}
        onReset={resetApp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col relative overflow-hidden">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-900/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Header */}
      <header className="p-6 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">CityLens AR</h1>
        </div>
        <div className="text-xs font-mono text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded">
          v1.0
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {appState === AppState.IDLE && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
                Explore the History Around You
              </h2>
              <p className="text-gray-400 text-lg">
                Snap a photo of any landmark. We'll identify it, find its hidden stories, and narrate them for you.
              </p>
            </div>

            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-white/5 transition duration-200">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Capture Landmark</h3>
                <p className="text-sm text-gray-500 mb-6">Take a photo or upload from gallery</p>
                
                <label className="cursor-pointer bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition active:scale-95">
                  Open Camera
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-6 text-gray-500 text-xs uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                Global Data
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                Smart Audio
              </span>
            </div>
          </div>
        )}

        {/* Loading States */}
        {appState === AppState.ANALYZING_IMAGE && <LoadingOverlay message="Analyzing your photo..." />}
        {appState === AppState.SEARCHING_HISTORY && <LoadingOverlay message="Searching history archives..." />}
        {appState === AppState.GENERATING_AUDIO && <LoadingOverlay message="Creating audio tour..." />}
        
        {/* Error State */}
        {appState === AppState.ERROR && (
          <div className="w-full max-w-md bg-red-900/50 border border-red-500/50 p-6 rounded-xl text-center backdrop-blur-md animate-fadeIn">
             <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
            <p className="text-gray-300 mb-6">{errorMsg}</p>
            <button 
              onClick={resetApp}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition"
            >
              Try Again
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
