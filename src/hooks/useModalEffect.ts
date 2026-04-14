import { useEffect, useRef } from 'react';

interface UseModalEffectOptions {
  isOpen: boolean;
  onClose: () => void;
  disableClose?: boolean;
}

export function useModalEffect({ isOpen, onClose, disableClose = false }: UseModalEffectOptions) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Focus Logic (LOCKED FIX)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      
      // Focus the first available input or interactive element
      const input = modalRef.current?.querySelector(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
      ) as HTMLElement;

      input?.focus();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen]); // 🔒 Only re-run when modal actually opens/closes

  // 2. Modal Interface Logic (Scroll lock, escape, and tab trap)
  useEffect(() => {
    if (!isOpen) return;

    // Capture Previous Focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Scroll Lock with Jitter Prevention
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalPadding = window.getComputedStyle(document.body).paddingRight;
    const originalOverflow = document.body.style.overflow;

    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) {
        onClose();
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements || focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.paddingRight = originalPadding;
      document.body.style.overflow = originalOverflow;

      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [isOpen, onClose, disableClose]); // These can be unstable without resetting focus

  return { modalRef };
}
