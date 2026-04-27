import React, { useState } from 'react';
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import Sidebar from './components/Sidebar';
import DebateRoom from './components/DebateRoom';
import NewSession from './components/NewSession';
import LandingPage from './components/LandingPage';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState(null);

  return (
    <div className="h-screen flex flex-col font-sans bg-gray-50 overflow-hidden">

      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        {/* Top Navbar */}
        <header className="h-16 flex-none flex justify-between items-center px-6 bg-white border-b border-gray-200 shadow-sm z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#023c28] rounded-md flex items-center justify-center">
              <span className="text-[#c5f015] font-bold text-xl leading-none">D</span>
            </div>
            <span className="text-xl font-bold text-[#023c28]">Debate AI</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <Sidebar
            currentSessionId={currentSessionId}
            onSelectSession={(id) => setCurrentSessionId(id)}
          />
          <section className="flex-1 overflow-hidden">
            {currentSessionId ? (
              <DebateRoom sessionId={currentSessionId} />
            ) : (
              <NewSession onSessionCreated={(id) => setCurrentSessionId(id)} />
            )}
          </section>
        </main>
      </SignedIn>

    </div>
  );
}

export default App;
