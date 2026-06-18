import { useEffect, useState } from 'react';

export const WicketAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: initial
    // Stage 1: ball comes in
    // Stage 2: ball hits stump
    // Stage 3: OUT text
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 600);
    const t3 = setTimeout(() => setStage(3), 1000);
    const t4 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-lg h-96 flex items-center justify-center">
        
        {/* Stumps */}
        <div className="absolute bottom-10 flex gap-2 z-10">
          <div className={`w-3 h-32 bg-[#e6c280] rounded-t-sm shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)] origin-bottom transition-transform duration-300 ${stage >= 2 ? 'rotate-[-15deg]' : ''}`}></div>
          <div className={`w-3 h-32 bg-[#e6c280] rounded-t-sm shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)] origin-bottom transition-transform duration-300 ${stage >= 2 ? 'rotate-[45deg] translate-y-4' : ''}`}></div>
          <div className={`w-3 h-32 bg-[#e6c280] rounded-t-sm shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)] origin-bottom transition-transform duration-300 ${stage >= 2 ? 'rotate-[10deg]' : ''}`}></div>
          
          {/* Bails */}
          <div className={`absolute -top-1 left-0 w-5 h-1.5 bg-[#e6c280] rounded-full transition-all duration-500 ${stage >= 2 ? '-translate-y-10 -translate-x-10 rotate-[720deg] opacity-0' : ''}`}></div>
          <div className={`absolute -top-1 right-0 w-5 h-1.5 bg-[#e6c280] rounded-full transition-all duration-500 ${stage >= 2 ? '-translate-y-16 translate-x-10 rotate-[720deg] opacity-0' : ''}`}></div>
        </div>

        {/* Ball */}
        <div className={`absolute w-6 h-6 bg-red-600 rounded-full shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_0_10px_red] z-20 transition-all ease-in duration-500
          ${stage === 0 ? 'top-0 left-0 scale-50 opacity-0' : ''}
          ${stage === 1 ? 'top-1/2 left-1/2 -translate-x-10 -translate-y-10 scale-100 opacity-100' : ''}
          ${stage >= 2 ? 'bottom-16 left-1/2 translate-x-2 translate-y-4 scale-100 opacity-100' : ''}
        `}>
          <div className="w-full h-[2px] bg-white/50 absolute top-1/2 -translate-y-1/2 shadow-sm transform rotate-45"></div>
        </div>

        {/* OUT Text */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 z-30 ${stage >= 3 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
          <span className="text-8xl md:text-9xl font-extrabold text-red-500 tracking-widest drop-shadow-[0_0_30px_rgba(239,68,68,1)] uppercase italic transform -rotate-12">
            Wicket!
          </span>
        </div>

      </div>
    </div>
  );
};
