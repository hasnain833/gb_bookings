import React from 'react';

interface GBLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export default function GBLogo({ className = '', size = 'md', showText = true, layout = 'horizontal' }: GBLogoProps) {
  // Sizing maps
  const svgDimensions = {
    sm: 'w-8 h-6',
    md: 'w-12 h-9 sm:w-14 sm:h-10',
    lg: 'w-20 h-14 sm:w-24 sm:h-16',
    xl: 'w-28 h-20 sm:w-36 sm:h-24'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-5xl'
  };

  return (
    <div className={`inline-flex shrink-0 max-w-full ${layout === 'vertical' ? 'flex-col items-start text-left gap-1' : 'items-center gap-1.5 sm:gap-2.5'} ${className}`}>
      {/* Mountain + Target Sun Graphic SVG matching reference logo */}
      <svg className={`${svgDimensions[size]} shrink-0 overflow-visible`} viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gbLeftWingGrad" x1="0%" y1="20%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#29ABE2" />
            <stop offset="45%" stopColor="#0071BC" />
            <stop offset="100%" stopColor="#0B3E91" />
          </linearGradient>

          <linearGradient id="gbRightWingGrad" x1="10%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00A358" />
            <stop offset="55%" stopColor="#008247" />
            <stop offset="100%" stopColor="#006F3C" />
          </linearGradient>

          <linearGradient id="gbCenterDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006F3C" />
            <stop offset="100%" stopColor="#003E22" />
          </linearGradient>

          <linearGradient id="gbOrangeTargetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8000" />
            <stop offset="100%" stopColor="#F36C21" />
          </linearGradient>
        </defs>

        {/* Orange Target/Compass Needle hovering above the mountain notch */}
        <g id="orange-compass">
          {/* Target Ring */}
          <circle cx="80" cy="22" r="13" stroke="url(#gbOrangeTargetGrad)" strokeWidth="4.5" fill="none" />
          {/* Central Dot */}
          <circle cx="80" cy="22" r="4" fill="url(#gbOrangeTargetGrad)" />
          {/* Needle / Compass Arrow */}
          <line x1="80" y1="22" x2="95" y2="7" stroke="url(#gbOrangeTargetGrad)" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Left Mountain Wing (Cyan to Ocean Blue) */}
        <path 
          d="M12 82 C32 72 56 42 80 34 C66 58 48 80 12 82 Z" 
          fill="url(#gbLeftWingGrad)" 
        />

        {/* Right Mountain Wing (Lime to Emerald Green) */}
        <path 
          d="M148 82 C128 72 104 38 80 34 C94 58 112 80 148 82 Z" 
          fill="url(#gbRightWingGrad)" 
        />

        {/* Foreground Mountain Slope / Dark Valley */}
        <path 
          d="M48 82 C66 58 88 52 132 82 C104 85 68 85 48 82 Z" 
          fill="url(#gbCenterDarkGrad)" 
        />

        {/* White Curved Separator Lines between mountain layers */}
        <path d="M80 34 C66 58 48 82 48 82" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M80 34 C94 56 132 82 132 82" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      </svg>

      {/* Exact Brand Name Typography: GB (Serif Deep Blue) + Bookings (Bold Emerald Green) + .com (Orange) */}
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight leading-none whitespace-nowrap select-none inline-flex items-baseline`}>
          <span className="text-[#0B3E91] font-serif font-black tracking-tighter" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            GB
          </span>
          <span className="text-[#006F3C] font-extrabold tracking-tight">
            Bookings
          </span>
          <span className="text-[#F36C21] font-bold tracking-tight">
            .com
          </span>
        </span>
      )}
    </div>
  );
}
