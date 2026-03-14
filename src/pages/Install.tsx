import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ParticlesBackground from '@/components/ParticlesBackground';
import {
  GraduationCap,
  Download,
  Smartphone,
  Globe,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Package,
  Shield,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';

const APK_URL = import.meta.env.VITE_APK_DOWNLOAD_URL as string | undefined;

const steps = [
  {
    num: '01',
    title: 'Download the APK',
    desc: 'Tap the download button above to get the latest SCI Archive APK file.',
  },
  {
    num: '02',
    title: 'Allow Unknown Sources',
    desc: 'On your Android device go to Settings → Security → Install Unknown Apps and allow your browser or file manager.',
  },
  {
    num: '03',
    title: 'Open the APK file',
    desc: 'Locate the downloaded file in your Downloads folder and tap it to begin installation.',
  },
  {
    num: '04',
    title: 'Launch SCI Archive',
    desc: 'Tap Open after installation completes. Sign in with your institutional credentials.',
  },
];

const buildSteps = [
  'Push code to GitHub — your repo is at github.com/SilvaTechB/sci-project',
  'Sign up free at codemagic.io using your GitHub account',
  'Add application → select your repo → choose codemagic.yaml',
  'Add 3 env vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID',
  'Click Start new build → wait ~10 min → download APK from Artifacts',
  'Set VITE_APK_DOWNLOAD_URL in Replit Secrets and redeploy',
];

export default function Install() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticlesBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">SCI Archive</span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/">← Back</Link>
            </Button>
          </nav>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 py-10 text-center max-w-2xl">
          {/* App icon */}
          <div className="mx-auto mb-6 w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-primary/30 ring-1 ring-white/10">
            <img src="/favicon.png" alt="SCI Archive icon" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            Get <span className="gradient-text">SCI Archive</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Native Android app — full experience, offline-ready, no browser needed.
          </p>

          {/* Download / Build button */}
          {APK_URL ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Button
                variant="gradient"
                size="xl"
                className="w-full sm:w-auto group"
                onClick={() => window.open(APK_URL, '_blank')}
                data-testid="button-download-apk"
              >
                <Download className="w-5 h-5 mr-2" />
                Download APK
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glass" size="xl" asChild className="w-full sm:w-auto">
                <Link to="/login">
                  <Globe className="w-5 h-5 mr-2" />
                  Use Web Version
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Button variant="glass" size="xl" className="w-full sm:w-auto opacity-60 cursor-not-allowed" disabled>
                <Package className="w-5 h-5 mr-2" />
                APK — Build Required
              </Button>
              <Button variant="gradient" size="xl" asChild className="w-full sm:w-auto">
                <Link to="/login">
                  <Globe className="w-5 h-5 mr-2" />
                  Use Web Version Now
                </Link>
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground" data-testid="text-apk-version">
            Android 7.0+ required · Free download · ~5MB · v2.0
          </p>
        </section>

        {/* Feature pills */}
        <section className="container mx-auto px-4 pb-10">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Shield, label: 'Secure auth' },
              { icon: Zap, label: 'Fast uploads' },
              { icon: Smartphone, label: 'Mobile-first' },
              { icon: CheckCircle, label: 'Offline support' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium"
              >
                <Icon className="w-4 h-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* Install steps */}
        <section className="container mx-auto px-4 pb-12 max-w-2xl">
          <h2 className="text-xl font-display font-bold text-center mb-6">How to Install</h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <Card key={step.num} className="glass-card border-border/50">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{step.num}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Build the APK section (shown when no APK_URL is configured) */}
        {!APK_URL && (
          <section className="container mx-auto px-4 pb-12 max-w-2xl">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-display font-bold">Build Your APK (Free)</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Use <strong className="text-foreground">Codemagic</strong> — a free cloud CI service — to compile
                  the Android APK. The project is already fully configured; just follow these steps:
                </p>
                <ol className="space-y-3">
                  {buildSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">After upload set this Replit secret to activate the Download button:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-primary font-mono flex-1 truncate">
                      VITE_APK_DOWNLOAD_URL=https://your-apk-url.com/app-debug.apk
                    </code>
                    <button
                      onClick={() => handleCopy('VITE_APK_DOWNLOAD_URL=https://your-apk-url.com/app-debug.apk')}
                      className="shrink-0 p-1.5 rounded hover:bg-muted transition-colors"
                      title="Copy"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => window.open('https://codemagic.io/start/', '_blank')}
                  data-testid="button-open-codemagic"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Codemagic
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Web version CTA */}
        <section className="container mx-auto px-4 pb-16 max-w-2xl">
          <Card className="glass-card border-border/50 text-center">
            <CardContent className="p-6">
              <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg mb-2">Use the Web Version Immediately</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The full app is live at{' '}
                <a
                  href="https://sci-project.replit.app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  sci-project.replit.app
                </a>
                . Works on any browser — no installation required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="gradient" asChild>
                  <Link to="/register">
                    Create Account
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="glass" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
