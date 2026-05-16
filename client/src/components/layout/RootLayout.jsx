import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Tiles } from '../ui/Tiles';

export default function RootLayout() {
  return (
    <div className="flex min-h-screen font-sans bg-[var(--t-bg)]" style={{ position: 'relative' }}>
      {/* Fixed subtle grid background behind the app */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <Tiles rowCount={26} colCount={42} cellSize={48} />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

