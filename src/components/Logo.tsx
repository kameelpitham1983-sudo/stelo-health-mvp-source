import { Activity } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 'md', showText = true, variant = 'light' }: LogoProps) {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 22;
  const containerSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const textColor = variant === 'light' ? 'text-ink-900' : 'text-white';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${containerSize} rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm`}>
        <Activity size={iconSize} className="text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-extrabold ${textSize} ${textColor}`}>Stelo Health</span>
          <span className={`text-[10px] font-medium ${variant === 'light' ? 'text-ink-400' : 'text-white/60'} tracking-wide`}>OCCUPATIONAL & TRAVEL HEALTH</span>
        </div>
      )}
    </div>
  );
}
