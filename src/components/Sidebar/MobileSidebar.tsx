import { motion, AnimatePresence } from 'framer-motion';
import { SidebarContent } from './SidebarContent';
import { useModalEffect } from '../../hooks/useModalEffect';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { modalRef } = useModalEffect({
    isOpen,
    onClose
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay (z-40) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer (z-50) */}
          <motion.div
            ref={modalRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x < -100 || velocity.x < -500) {
                onClose();
              }
            }}
            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm z-50 flex flex-col md:hidden shadow-2xl"
            style={{ background: 'var(--crm-navy-deep)', borderRight: '1px solid var(--crm-border)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            <SidebarContent onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
