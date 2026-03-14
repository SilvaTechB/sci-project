import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus, Smartphone, ArrowDown } from 'lucide-react';

interface PWAInstallWallProps {
  children: React.ReactNode;
}

const iosSteps = [
  {
    icon: <Share className="w-4 h-4 text-cyan-400" />,
    title: 'Tap the Share button',
    desc: 'The box with an arrow pointing up — at the bottom of Safari',
  },
  {
    icon: <Plus className="w-4 h-4 text-cyan-400" />,
    title: 'Add to Home Screen',
    desc: 'Scroll down in the share sheet and tap "Add to Home Screen"',
  },
  {
    icon: <Download className="w-4 h-4 text-cyan-400" />,
    title: 'Tap Add',
    desc: 'Tap "Add" in the top-right corner — the icon appears on your home screen',
  },
];

const PWAInstallWall = ({ children }: PWAInstallWallProps) => {
  const { isStandalone, platform, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  // Already installed — render the real app
  if (isStandalone) return <>{children}</>;

  const handleInstall = () => {
    setInstalling(true);
    promptInstall();
    // Reset after 4s in case user dismisses the browser prompt
    setTimeout(() => setInstalling(false), 4000);
  };

  const isAndroidOrDesktop = platform === 'android' || platform === 'desktop' || platform === 'unknown';

  return (
    <>
      {/* Blurred non-interactive background showing the app behind */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="w-full h-full blur-md opacity-20 scale-110">{children}</div>
      </div>

      {/* Full-screen install wall */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #0d1224 100%)' }}
      >
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">

          {/* App icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-500/40">
              <img src="/icon-512.png" alt="SCI Archive" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Download className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Install SCI Archive</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              SCI Archive must be installed on your device.<br />
              It is not available to use in a browser.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Works offline', 'Fast & secure', 'No browser needed'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300"
              >
                {f}
              </span>
            ))}
          </div>

          {/* ── Android / Desktop: tap-to-install button ── */}
          {isAndroidOrDesktop && (
            <div className="w-full space-y-3">
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-xl shadow-cyan-500/30 transition-all"
              >
                {installing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Opening installer…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Install App
                  </span>
                )}
              </Button>

              <p className="text-xs text-slate-500 leading-relaxed">
                {platform === 'android'
                  ? 'Tap Install App above. If nothing happens, open your browser menu and choose "Add to Home screen".'
                  : 'Tap Install App above. If nothing happens, click the install icon (⊕) in your browser\'s address bar.'}
              </p>
            </div>
          )}

          {/* ── iOS: always-visible steps ── */}
          {platform === 'ios' && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 text-slate-300 mb-1">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold">Install on iPhone / iPad</span>
              </div>

              <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                <div className="p-4 space-y-4">
                  {iosSteps.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
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
                  Open from your home screen after adding
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Installing gives you the full experience — faster, offline-capable, and without any browser interface.
          </p>
        </div>
      </div>
    </>
  );
};

export default PWAInstallWall;
