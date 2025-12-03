'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
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
import { API_BASE_URL, API_VERSION } from '@/lib/constants';
import { AlertCircle, Bot, CheckCircle2, Loader2, XCircle } from 'lucide-react';

type PageStatus = 'loading' | 'valid' | 'invalid' | 'activating' | 'success' | 'error';

interface InvitationData {
  username: string;
  email: string | null;
  role: string;
  expiresAt: string;
}

export default function ActivatePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<PageStatus>('loading');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Validate token on load
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}${API_VERSION}/users/invite/${token}`
        );

        if (response.data.success) {
          setInvitation(response.data.data);
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch (err: any) {
        console.error('Token validation error:', err);
        setStatus('invalid');
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setStatus('activating');

    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_VERSION}/users/activate`,
        {
          token,
          password,
        }
      );

      if (response.data.success) {
        setStatus('success');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Error al activar la cuenta');
        setStatus('error');
      }
    } catch (err: any) {
      console.error('Activation error:', err);
      setError(
        err.response?.data?.message || 'Error al activar la cuenta'
      );
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Validando invitación...</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 mx-auto text-neon-red" />
            <h3 className="mt-4 text-lg font-semibold text-neon-red">
              Invitación Inválida
            </h3>
            <p className="mt-2 text-muted-foreground">
              Este enlace de invitación no es válido o ha expirado.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Contacta al administrador para recibir una nueva invitación.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Ir al Login
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-neon-green" />
            <h3 className="mt-4 text-lg font-semibold text-neon-green">
              Cuenta Activada
            </h3>
            <p className="mt-2 text-muted-foreground">
              Tu cuenta ha sido activada exitosamente.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Redirigiendo al login...
            </p>
          </div>
        );

      case 'valid':
      case 'activating':
      case 'error':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-neon-red/30 bg-neon-red/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/30 p-4 rounded-lg border border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuario:</span>
                  <span className="font-medium">{invitation?.username}</span>
                </div>
                {invitation?.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{invitation?.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rol:</span>
                  <span className="font-medium">{invitation?.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={status === 'activating'}
                className="h-11"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={status === 'activating'}
                className="h-11"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={status === 'activating'}
            >
              {status === 'activating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activando...
                </>
              ) : (
                'Activar Cuenta'
              )}
            </Button>
          </form>
        );

      default:
        return null;
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
            <Bot className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-neon-cyan to-primary bg-clip-text text-transparent">
            FortLoot
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {status === 'loading'
              ? 'Verificando invitación...'
              : status === 'invalid'
              ? 'Invitación no válida'
              : status === 'success'
              ? 'Cuenta activada'
              : 'Configura tu contraseña para activar tu cuenta'}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
