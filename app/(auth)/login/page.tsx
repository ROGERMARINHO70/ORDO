'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Mode = 'login' | 'signup' | 'magic'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        })
        if (error) throw error
        setMessage('Link enviado! Verifique seu e-mail.')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        })
        if (error) throw error
        setMessage('Conta criada! Verifique seu e-mail para confirmar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/hoje')
        router.refresh()
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
            O
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Ordo</h1>
          <p className="text-sm text-muted-foreground mt-1">Centro de Comando da Aprovação</p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {mode === 'signup' ? 'Criar conta' : mode === 'magic' ? 'Link mágico' : 'Entrar'}
            </CardTitle>
            <CardDescription className="text-xs">
              {mode === 'magic'
                ? 'Receba um link de acesso por e-mail, sem senha.'
                : 'Investigador PC-BA · Prova 20/10/2026'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {mode !== 'magic' && (
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? 'Aguarde…'
                  : mode === 'signup'
                    ? 'Criar conta'
                    : mode === 'magic'
                      ? 'Enviar link'
                      : 'Entrar'}
              </Button>

              {message && (
                <p
                  className={`text-xs text-center ${message.includes('rro') ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {message}
                </p>
              )}
            </form>

            <div className="mt-4 flex flex-col gap-1 text-center">
              {mode !== 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Já tenho conta — entrar
                </button>
              )}
              {mode !== 'signup' && (
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Criar nova conta
                </button>
              )}
              {mode !== 'magic' && (
                <button
                  type="button"
                  onClick={() => setMode('magic')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Entrar com link mágico
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
