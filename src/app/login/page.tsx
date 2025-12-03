'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginWithCredentials, verifyOTP, setApiKey } from '@/lib/auth';
import { AlertCircle, Bot, ArrowLeft, Smartphone, Loader2 } from 'lucide-react';

type LoginStep = 'credentials' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneLastDigits, setPhoneLastDigits] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (step === 'otp' && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, expiresIn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithCredentials(username, password);

      if (result.success && result.data) {
        setPhoneLastDigits(result.data.phoneLastDigits);
        setExpiresIn(result.data.expiresIn);
        setStep('otp');
      } else {
        setError(result.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(username, otp);

      if (result.success && result.data) {
        // Save the API key and redirect
        setApiKey(result.data.apiKey);
        router.push('/');
      } else {
        setError(result.message || 'Código OTP inválido');
      }
    } catch (err) {
      setError('Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setError('');
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await loginWithCredentials(username, password);

      if (result.success && result.data) {
        setExpiresIn(result.data.expiresIn);
        setOtp('');
      } else {
        setError(result.message || 'Error al reenviar el código');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-white/10 shadow-glass-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-neon-purple animate-pulse-neon">
            {step === 'credentials' ? (
              <Bot className="h-7 w-7 text-white" />
            ) : (
              <Smartphone className="h-7 w-7 text-white" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-neon-cyan to-primary bg-clip-text text-transparent">
            FortLoot
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'credentials'
              ? 'Ingresa tus credenciales para acceder'
              : `Código enviado al ****${phoneLastDigits}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-neon-red/30 bg-neon-red/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-neon-red/30 bg-neon-red/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm text-muted-foreground mb-4">
                <p>Revisa tu WhatsApp e ingresa el código de 6 dígitos</p>
                {expiresIn > 0 ? (
                  <p className="mt-1 text-neon-cyan font-medium">
                    Expira en {formatTime(expiresIn)}
                  </p>
                ) : (
                  <p className="mt-1 text-neon-red font-medium">
                    El código ha expirado
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium">Código OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading || otp.length !== 6 || expiresIn === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToCredentials}
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Volver
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  Reenviar código
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-muted-foreground">
            <p>Admin Dashboard v1.0</p>
            <p className="mt-1">
              Powered by <span className="text-primary font-medium">FortLoot</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
