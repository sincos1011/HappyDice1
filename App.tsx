import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, Star, Dices, RotateCw, History, Smartphone, Check } from 'lucide-react';
import Die from './components/Die';
import { DieValue, RollResult } from './types';
import { generateRollNarrative } from './services/geminiService';

const App: React.FC = () => {
  const [numDice, setNumDice] = useState<number>(2);
  const [diceValues, setDiceValues] = useState<DieValue[]>([1, 1]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [currentNarrative, setCurrentNarrative] = useState<string>("");
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState<boolean>(false);
  
  // Mobile Shake State
  const [shakeEnabled, setShakeEnabled] = useState<boolean>(false);
  const lastShakeRef = useRef<number>(0);

  // Animation duration in ms
  const ROLL_DURATION = 800;

  const handleRoll = useCallback(async () => {
    if (isRolling) return;

    setIsRolling(true);
    setCurrentNarrative(""); 
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Sound effect simulation
    if (soundEnabled) {
      // In a real app, play sound here
    }

    // Determine results immediately (logic layer), but wait to show them visually
    const newValues: DieValue[] = Array.from({ length: numDice }, () => 
      (Math.floor(Math.random() * 6) + 1) as DieValue
    );

    // Wait for the animation duration to finish before "setting" the final state
    // The Die component handles the visual spin during this time
    setTimeout(async () => {
      setDiceValues(newValues);
      setIsRolling(false);
      
      const sum = newValues.reduce((a, b) => a + b, 0);
      const newResult: RollResult = {
        id: Date.now().toString(),
        values: newValues,
        sum,
        timestamp: Date.now()
      };

      // Vibrate on land
      if (navigator.vibrate) {
        navigator.vibrate([20, 50, 20]);
      }

      if (aiEnabled) {
        setIsGeneratingNarrative(true);
        try {
          const narrative = await generateRollNarrative(newValues, sum);
          setCurrentNarrative(narrative);
          newResult.aiNarrative = narrative;
        } catch (e) {
          console.error(e);
        } finally {
          setIsGeneratingNarrative(false);
        }
      }

      setHistory(prev => [newResult, ...prev].slice(0, 6)); 
    }, ROLL_DURATION);

  }, [isRolling, numDice, aiEnabled, soundEnabled]);

  // Shake Detection Logic
  useEffect(() => {
    let motionHandler: ((event: DeviceMotionEvent) => void) | null = null;

    if (shakeEnabled) {
      motionHandler = (event: DeviceMotionEvent) => {
        const { accelerationIncludingGravity } = event;
        if (!accelerationIncludingGravity) return;

        const x = accelerationIncludingGravity.x || 0;
        const y = accelerationIncludingGravity.y || 0;
        const z = accelerationIncludingGravity.z || 0;

        // Calculate total acceleration vector
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        // Threshold for shake (approx 2.5g)
        const SHAKE_THRESHOLD = 25; 
        const now = Date.now();

        if (acceleration > SHAKE_THRESHOLD) {
          // Debounce shake to prevent double triggering
          if (now - lastShakeRef.current > 1000 && !isRolling) {
            lastShakeRef.current = now;
            handleRoll();
          }
        }
      };
      
      window.addEventListener('devicemotion', motionHandler);
    }

    return () => {
      if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
      }
    };
  }, [shakeEnabled, isRolling, handleRoll]);

  // Request Permission for iOS 13+
  const requestShakePermission = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setShakeEnabled(true);
        } else {
          alert('Permission denied. Cannot use Shake to Roll.');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Non-iOS 13+ devices usually don't need permission or support it natively
      setShakeEnabled(true);
    }
  };

  const updateDiceCount = (count: number) => {
    if (count < 1 || count > 4) return; 
    setNumDice(count);
    setDiceValues(prev => {
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill(1)] as DieValue[];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-pop-blue via-purple-100 to-pop-pink font-sans flex flex-col items-center overflow-hidden relative">
      
      {/* Decorative Floating Background Items */}
      <div className="absolute top-10 left-10 text-white/40 animate-float pointer-events-none">
        <Star size={48} fill="currentColor" />
      </div>
      <div className="absolute bottom-20 right-20 text-white/30 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>
        <div className="w-16 h-16 rounded-full bg-pop-mint/50 blur-xl"></div>
      </div>
      
      {/* Header */}
      <header className="w-full max-w-4xl p-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white">
          <Dices className="text-pop-pinkDark w-6 h-6" />
          <h1 className="text-xl font-black tracking-wide text-pop-text">
            HAPPY<span className="text-pop-pink">DICE</span>
          </h1>
        </div>
        
        <div className="flex gap-2">
            {!shakeEnabled && (
               <button 
                 onClick={requestShakePermission}
                 className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold transition-all text-xs shadow-sm btn-3d bg-pop-purple text-pop-text [--shadow-color:#a1c4fd]"
               >
                 <Smartphone className="w-3 h-3" />
                 <span>Enable Shake</span>
               </button>
            )}

            <button 
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`p-2 rounded-full font-bold transition-all text-xs shadow-sm btn-3d
              ${aiEnabled 
                ? 'bg-pop-mint text-emerald-700 [--shadow-color:#4ade80]' 
                : 'bg-white text-gray-400 border border-gray-200 [--shadow-color:#e5e7eb]'}`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content - Flex-1 to take remaining space, scrollable if needed */}
      <main className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center relative z-10 px-4 gap-4 md:gap-8">
        
        {/* Dice Area */}
        <div className="w-full flex justify-center items-center min-h-[220px]">
           <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {diceValues.map((val, idx) => (
              <Die 
                key={idx} 
                value={val} 
                rolling={isRolling} 
                delay={idx * 0.1}
                duration={ROLL_DURATION}
              />
            ))}
           </div>
        </div>

        {/* Narrative Bubble */}
        <div className="w-full max-w-sm h-[90px] flex items-center justify-center perspective-[1000px]">
           {isGeneratingNarrative ? (
             <div className="bg-white px-5 py-2 rounded-2xl shadow-lg animate-pulse flex items-center gap-2 text-pop-blueDark">
               <Sparkles className="w-4 h-4 animate-spin" />
               <span className="font-bold text-sm">Magic is happening...</span>
             </div>
           ) : currentNarrative ? (
             <div className="relative bg-white px-6 py-4 rounded-3xl shadow-xl border-b-4 border-pop-blue/30 transform transition-all hover:scale-105 animate-bounce-slight w-full">
               <p className="text-lg font-bold text-center text-pop-text leading-snug">
                 {currentNarrative}
               </p>
             </div>
           ) : (
             <div className="text-white/60 font-bold text-lg animate-bounce-slight flex flex-col items-center gap-1">
                <span>Tap or Shake to Roll!</span>
             </div>
           )}
        </div>

        {/* Control Panel */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl w-full flex flex-col items-center gap-4 border border-white">
          
          {/* Top Row: Dice Count + Total */}
          <div className="w-full flex justify-between items-center px-2">
            
            {/* Dice Count Selector */}
            <div className="flex gap-2">
               {[1, 2, 3, 4].map(num => (
                 <button
                   key={num}
                   onClick={() => updateDiceCount(num)}
                   className={`w-10 h-10 rounded-xl font-black text-base flex items-center justify-center transition-all btn-3d
                     ${numDice === num 
                       ? 'bg-pop-blue text-white [--shadow-color:#769cc9]' 
                       : 'bg-gray-100 text-gray-400 hover:bg-white [--shadow-color:#d1d5db]'}`}
                 >
                   {num}
                 </button>
               ))}
            </div>

             {/* Total */}
            <div className="flex flex-col items-end">
               <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Total</span>
               <span className="text-4xl font-black text-pop-text drop-shadow-sm leading-none">
                 {diceValues.reduce((a, b) => a + b, 0)}
               </span>
            </div>
          </div>

          {/* ROLL Button */}
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className={`
              w-full py-4 rounded-2xl font-black text-xl tracking-wider uppercase transition-all
              flex items-center justify-center gap-3 btn-3d active:scale-[0.98]
              ${isRolling 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed [--shadow-color:#d1d5db]' 
                : 'bg-pop-pink text-white shadow-lg shadow-pop-pink/30 [--shadow-color:#d96c70]'
              }
            `}
          >
             {isRolling ? (
               'Rolling...' 
             ) : (
               <>
                 Let's Roll! <RotateCw strokeWidth={3} className={shakeEnabled ? "animate-spin-slow" : ""} />
               </>
             )}
          </button>
        </div>

      </main>

       {/* History Drawer - Hidden on small mobile screens if too crowded, or collapsible */}
      <section className="w-full max-w-3xl px-6 pb-6 z-10 shrink-0 hidden md:block">
        <div className="flex items-center gap-2 mb-2 text-white/80">
           <History className="w-4 h-4" />
           <h2 className="font-bold text-sm">Recent Luck</h2>
        </div>
        <div className="grid grid-cols-6 gap-2">
           {history.slice(0, 6).map((roll) => (
             <div key={roll.id} className="bg-white/60 p-2 rounded-xl flex flex-col items-center">
                <span className="text-xs font-bold text-pop-text">{roll.sum}</span>
             </div>
           ))}
        </div>
      </section>

    </div>
  );
};

export default App;