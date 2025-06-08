import { Bell as BellIcon } from 'lucide-react';// components/Header.tsx
export function Header() {
    return (
      <header className="fixed top-0 w-full z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
          <img src="/assets/logo.svg" alt="CM Platform" className="h-8" />
  
          <nav className="flex items-center space-x-6 text-white font-semibold">
            <a href="/dashboard" className="hover:underline">Dashboard</a>
            <a href="/projects" className="hover:underline">Projects</a>
            <button aria-label="Notifications">
              <BellIcon className="h-6 w-6" />
            </button>
            <img src="/assets/avatar.jpg" alt="You" className="h-8 w-8 rounded-full" />
          </nav>
        </div>
      </header>
    );
  }
  