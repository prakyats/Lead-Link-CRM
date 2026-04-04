import { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';
import { toast } from 'sonner';

export function MobileNoticeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only check if we are on a smaller screen and hasn't been dismissed
    const isMobileViewport = window.innerWidth < 768;
    const isDismissed = localStorage.getItem('leadlink_hide_mobile_banner');
    
    if (isMobileViewport && !isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('leadlink_hide_mobile_banner', 'true');
    setIsVisible(false);
  };

  const handleDesktopCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied! Open it on a desktop browser.');
  };

  if (!isVisible) return null;

  return (
    <div className="md:hidden bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-4 relative">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-4 pr-6">
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <Monitor className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-sm tracking-tight text-foreground lead leading-tight">LeadLink works best on larger screens for full functionality.</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDesktopCopy}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg bg-indigo-500/10"
            >
              Open on Desktop
            </button>
            <button 
              onClick={handleDismiss}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
