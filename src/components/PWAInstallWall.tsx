import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus, MoreVertical, Smartphone, Monitor, ArrowDown } from 'lucide-react';

interface PWAInstallWallProps {
  children: React.ReactNode;
}

const PWAInstallWall = ({ children }: PWAInstallWallProps) => {
  const { isStandalone, platform, canInstall, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  // App is already installed — let it run
  if (isStandalone) return <>{children}</>;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (!accepted) {
      // User dismissed — nothing to do, wall stays
    }
  };

  return (
    <>
      {/* Blurred, non-interactive background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="w-full h-full blur-md opacity-20 scale-110">
          {children}
        </div>
      </div>

      {/* Install Wall Overlay */}
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
           style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #0d1224 100%)' }}>

        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">

          {/* App Icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-500/40">
              <img src="/icon-512.png" alt="SCI Archive" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Download className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Install SCI Archive</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This app must be installed on your device. It is not available as a website.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Works offline', 'Fast & secure', 'No browser needed'].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
                {f}
              </span>
            ))}
          </div>

          {/* ─── Android / Desktop: one-tap install ─── */}
          {(platform === 'android' || platform === 'desktop') && (
            <div className="w-full space-y-4">
              {canInstall ? (
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-lg shadow-cyan-500/30"
                >
                  {installing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Installing…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Install App
                    </span>
                  )}
                </Button>
              ) : (
                /* Waiting for browser to fire beforeinstallprompt */
                <div className="w-full space-y-3">
                  <div className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <span className="w-4 h-4 border-2 border-slate-500/40 border-t-slate-400 rounded-full animate-spin" />
                    Preparing install…
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {platform === 'desktop'
                      ? 'Look for the install icon (⊕) in your browser\'s address bar, or open the browser menu and choose "Install SCI Archive".'
                      : 'Tap the menu button in your browser and select "Add to Home screen" or "Install app".'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── iOS: manual steps ─── */}
          {platform === 'ios' && (
            <div className="w-full space-y-4">
              <Button
                onClick={() => setShowIOSSteps(!showIOSSteps)}
                className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-lg shadow-cyan-500/30"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  How to Install on iPhone/iPad
                </span>
              </Button>

              {showIOSSteps && (
                <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                  <div className="p-4 space-y-4">
                    {[
                      {
                        icon: <Share className="w-5 h-5 text-cyan-400" />,
                        step: '1',
                        title: 'Tap Share',
                        desc: 'Tap the Share button at the bottom of Safari (the box with an arrow pointing up)',
                      },
                      {
                        icon: <Plus className="w-5 h-5 text-cyan-400" />,
                        step: '2',
                        title: 'Add to Home Screen',
                        desc: 'Scroll down and tap "Add to Home Screen"',
                      },
                      {
                        icon: <Download className="w-5 h-5 text-cyan-400" />,
                        step: '3',
                        title: 'Tap Add',
                        desc: 'Tap "Add" in the top-right corner — the app icon will appear on your home screen',
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <ArrowDown className="w-3.5 h-3.5" />
                    Open the app from your home screen after installing
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Fallback / unknown platform ─── */}
          {platform === 'unknown' && (
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">Install from your browser</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed text-left">
                Open your browser menu (⋮ or ···) and look for <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            SCI Archive is a Progressive Web App. Installing it gives you the full experience with no browser interface.
          </p>
        </div>
      </div>
    </>
  );
};

export default PWAInstallWall;
