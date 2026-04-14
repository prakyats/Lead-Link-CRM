import { useEffect, useRef } from 'react';

interface UseModalEffectOptions {
  isOpen: boolean;
  onClose: () => void;
  disableClose?: boolean;
}

export function useModalEffect({ isOpen, onClose, disableClose = false }: UseModalEffectOptions) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture Previous Focus
    previousFocus.current = document.activeElement as HTMLElement;

    // 2. Scroll Lock with Jitter Prevention
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalPadding = window.getComputedStyle(document.body).paddingRight;
    const originalOverflow = document.body.style.overflow;

    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';

    // 3. Focus management initialization (slight delay to let animation finish)
    const timeout = setTimeout(() => {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }, 100);

    // 4. Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape Handling
      if (e.key === 'Escape' && !disableClose) {
        onClose();
      }

      // Tab Trap
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
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Cleanup Scroll Lock
      document.body.style.paddingRight = originalPadding;
      document.body.style.overflow = originalOverflow;

      // Restore Focus
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [isOpen, onClose, disableClose]);

  return { modalRef };
}
