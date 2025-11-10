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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Fortloot Admin</CardTitle>
          <CardDescription>
            Enter your API key to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                You can find your API key in the backend settings
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connecting...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Bot Management Dashboard v1.0</p>
            <p className="mt-1">Powered by Fortloot</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
