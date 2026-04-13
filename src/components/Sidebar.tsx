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
        className="hidden lg:flex w-64 h-screen flex-col fixed top-0 left-0 z-40 shrink-0"
        style={{ background: 'var(--crm-navy-deep)', borderRight: '1px solid var(--crm-border)' }}
      >
        <SidebarContent />
      </div>
    </>
  );
}
