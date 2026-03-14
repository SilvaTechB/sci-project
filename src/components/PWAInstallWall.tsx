import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus, Smartphone, ArrowDown, Chrome, MoreVertical } from 'lucide-react';

interface PWAInstallWallProps {
  children: React.ReactNode;
}

const PWAInstallWall = ({ children }: PWAInstallWallProps) => {
  const { isStandalone, platform, canInstall, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  // App is already installed — let it run normally
  if (isStandalone) return <>{children}</>;

  const handleInstall = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  const isAndroidOrDesktop = platform === 'android' || platform === 'desktop';

  return (
    <>
      {/* Blurred non-interactive background */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="w-full h-full blur-md opacity-20 scale-110">{children}</div>
      </div>

      {/* Install wall */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #0d1224 100%)' }}
      >
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-5">

          {/* App icon */}
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
              This app must be installed on your device.<br />It cannot be used in a browser.
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

          {/* ── Android / Desktop ── */}
          {isAndroidOrDesktop && (
            <div className="w-full space-y-3">
              {/* One-tap install button — shows when browser prompt is ready */}
              {canInstall && (
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
                      Install App — Tap Here
                    </span>
                  )}
                </Button>
              )}

              {/* Always-visible manual instructions (shown until prompt fires) */}
              {!canInstall && (
                <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                  <div className="px-4 pt-4 pb-1">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      How to install
                    </p>
                    <div className="space-y-3">
                      {platform === 'android' ? (
                        <>
                          <Step
                            icon={<Chrome className="w-4 h-4 text-cyan-400" />}
                            text='Open this page in Chrome'
                          />
                          <Step
                            icon={<MoreVertical className="w-4 h-4 text-cyan-400" />}
                            text='Tap the ⋮ menu (top right)'
                          />
                          <Step
                            icon={<Plus className="w-4 h-4 text-cyan-400" />}
                            text='Tap "Add to Home screen" or "Install app"'
                          />
                        </>
                      ) : (
                        <>
                          <Step
                            icon={<Download className="w-4 h-4 text-cyan-400" />}
                            text='Look for the install icon ⊕ in the address bar'
                          />
                          <Step
                            icon={<Chrome className="w-4 h-4 text-cyan-400" />}
                            text='Or open the browser menu → "Install SCI Archive"'
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 text-center py-3">
                    Waiting for browser to enable one-tap install…
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── iOS ── */}
          {platform === 'ios' && (
            <div className="w-full space-y-3">
              <Button
                onClick={() => setShowIOSSteps(!showIOSSteps)}
                className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-lg shadow-cyan-500/30"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  {showIOSSteps ? 'Hide Steps' : 'How to Install on iPhone / iPad'}
                </span>
              </Button>

              {showIOSSteps && (
                <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                  <div className="p-4 space-y-4">
                    {[
                      {
                        icon: <Share className="w-4 h-4 text-cyan-400" />,
                        title: 'Tap the Share button',
                        desc: 'The box with an arrow pointing up at the bottom of Safari',
                      },
                      {
                        icon: <Plus className="w-4 h-4 text-cyan-400" />,
                        title: 'Add to Home Screen',
                        desc: 'Scroll down in the sheet and tap "Add to Home Screen"',
                      },
                      {
                        icon: <Download className="w-4 h-4 text-cyan-400" />,
                        title: 'Tap Add',
                        desc: 'Tap "Add" in the top-right — the icon appears on your home screen',
                      },
                    ].map((item, i) => (
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
              )}
            </div>
          )}

          {/* ── Fallback / unknown ── */}
          {platform === 'unknown' && (
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-2">
              <p className="text-sm font-medium text-slate-300">Install from your browser menu</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open the browser menu (⋮ or ···) and look for{' '}
                <strong className="text-white">"Install app"</strong> or{' '}
                <strong className="text-white">"Add to Home screen"</strong>.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            SCI Archive is a Progressive Web App — installing it gives you the full experience without the browser interface.
          </p>
        </div>
      </div>
    </>
  );
};

const Step = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <p className="text-sm text-slate-300 text-left">{text}</p>
  </div>
);

export default PWAInstallWall;
