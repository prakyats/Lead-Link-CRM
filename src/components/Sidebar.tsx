import { useState } from 'react';
import { TopNavbar } from './Sidebar/TopNavbar';
import { MobileSidebar } from './Sidebar/MobileSidebar';
import { SidebarContent } from './Sidebar/SidebarContent';
import { MobileNoticeBanner } from './Sidebar/MobileNoticeBanner';

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navigation */}
      <TopNavbar onOpenMenu={() => setIsMobileMenuOpen(true)} />

      {/* Global Mobile Notice Banner */}
      <MobileNoticeBanner />

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <div 
        className="hidden md:flex w-64 h-screen flex-col sticky top-0 shrink-0"
        style={{ background: 'var(--crm-navy-deep)', borderRight: '1px solid var(--crm-border)' }}
      >
        <SidebarContent />
      </div>
    </>
  );
}
