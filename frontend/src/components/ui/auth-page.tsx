import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import {
  ArrowLeft,
  AtSign,
  Grid2x2,
  Eye,
  EyeOff,
  User,
  Lock,
  Loader2,
} from 'lucide-react';
import { Input } from './input';

export interface AuthPageProps {
  mode: 'login' | 'register';
  onSubmit: (data: { name?: string; email: string; password: string }) => void;
  onSwitchMode: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
}

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function AuthPage({ mode, onSubmit, onSwitchMode, onBack, loading, error }: AuthPageProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...(mode === 'register' ? { name } : {}), email, password });
  };

  return (
    <main className="min-h-screen md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex">
        <div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
        <div className="z-10 flex items-center gap-2">
          <Grid2x2 className="size-6" />
          <p className="text-xl font-semibold">Vulnify</p>
        </div>
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;Protegemos tu reputación digital con inteligencia artificial.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold">
              ~ Vulnify Team
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className="relative flex min-h-screen flex-col justify-center p-4">
        <div
          aria-hidden
          className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
        >
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.06)_0,hsla(0,0%,55%,.02)_50%,rgba(255,255,255,0.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
        </div>
        {onBack && (
          <button onClick={onBack} className="absolute top-7 left-5 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.08] rounded-lg px-4 py-2 cursor-pointer">
            <ArrowLeft className="size-4" />
            Volver a la web
          </button>
        )}
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Grid2x2 className="size-6" />
            <p className="text-xl font-semibold">Vulnify</p>
          </div>
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-wide">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h1>
            <p className="text-zinc-500 text-base">
              {mode === 'login'
                ? 'Accede a tu panel de control'
                : 'Regístrate para gestionar tus proyectos'}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <Input
                  placeholder="Nombre completo"
                  className="ps-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-zinc-500">
                  <User className="size-4" />
                </div>
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="tu@email.com"
                className="ps-9"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-zinc-500">
                <AtSign className="size-4" />
              </div>
            </div>
            <div className="relative">
              <Input
                placeholder="Contraseña"
                className="ps-9 pe-9"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-zinc-500">
                <Lock className="size-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 me-2 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="text-center text-sm text-zinc-500">
            {mode === 'login' ? (
              <span>
                ¿No tienes cuenta?{' '}
                <button onClick={onSwitchMode} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/20 rounded-lg px-4 py-2 transition-all bg-transparent cursor-pointer">
                  Registrarse <ArrowLeft className="size-3.5 rotate-180" />
                </button>
              </span>
            ) : (
              <span>
                ¿Ya tienes cuenta?{' '}
                <button onClick={onSwitchMode} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/20 rounded-lg px-4 py-2 transition-all bg-transparent cursor-pointer">
                  Iniciar sesión <ArrowLeft className="size-3.5 rotate-180" />
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
