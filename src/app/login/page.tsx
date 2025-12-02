'use client';

import { useState } from 'react';
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
import { login } from '@/lib/auth';
import { AlertCircle, Bot } from 'lucide-react';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(apiKey);

      if (success) {
        router.push('/');
      } else {
        setError('Invalid API Key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
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
            <Bot className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-neon-cyan to-primary bg-clip-text text-transparent">
            FortLoot
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your API key to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-neon-red/30 bg-neon-red/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                You can find your API key in the backend settings
              </p>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? 'Connecting...' : 'Sign In'}
            </Button>
          </form>

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
