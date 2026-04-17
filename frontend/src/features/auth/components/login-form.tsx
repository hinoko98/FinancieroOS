'use client';

import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  CalendarDays,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

function normalizeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
}

function buildUsernamePreview(
  firstName: string,
  lastName: string,
  nationalId: string,
) {
  const firstSegment = normalizeToken(firstName).slice(0, 3);
  const lastSegment = normalizeToken(lastName).slice(0, 3);
  const idSegment = nationalId.replace(/\D/g, '').slice(-3);

  if (!firstSegment && !lastSegment && !idSegment) {
    return 'Se generara automaticamente';
  }

  return `${firstSegment}${lastSegment}${idSegment}` || 'Se generara automaticamente';
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data;

    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function LoginForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    birthDate: '',
    password: '',
  });

  const usernamePreview = useMemo(
    () =>
      buildUsernamePreview(
        registerForm.firstName,
        registerForm.lastName,
        registerForm.nationalId,
      ),
    [registerForm.firstName, registerForm.lastName, registerForm.nationalId],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login(loginForm);
      } else {
        const result = await register(registerForm);
        setLoginForm({
          username: result.username,
          password: '',
        });
        setRegisterForm({
          firstName: '',
          lastName: '',
          nationalId: '',
          birthDate: '',
          password: '',
        });
        setMode('login');
        setMessage(
          `Cuenta creada correctamente. Ingresa con el usuario ${result.username}.`,
        );
      }
    } catch (submitError) {
      setError(
        extractErrorMessage(
          submitError,
          mode === 'login'
            ? 'No fue posible iniciar sesion. Verifica tu usuario y contrasena.'
            : 'No fue posible crear la cuenta. Revisa los datos del formulario.',
        ),
      );
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-[var(--radius-shell)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-8 shadow-[var(--shadow-panel)]">
      <div className="mb-6 flex gap-2 rounded-full bg-[#f1e7db] p-1">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'login'
              ? 'bg-[var(--color-brand)] text-white'
              : 'text-[var(--color-brand-deep)]'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'register'
              ? 'bg-[var(--color-brand)] text-white'
              : 'text-[var(--color-brand-deep)]'
          }`}
        >
          Registro
        </button>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {mode === 'login' ? (
          <>
            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Usuario</span>
              <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                <UserRound className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-3 outline-none"
                  placeholder="admin001"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Contrasena</span>
              <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                <LockKeyhole className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-3 outline-none"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((current) => !current)}
                  className="text-[var(--color-muted)] transition hover:text-[var(--color-brand)]"
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="font-semibold">Nombre</span>
                <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                  <UserRound className="h-4 w-4 text-[var(--color-muted)]" />
                  <input
                    value={registerForm.firstName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 outline-none"
                    placeholder="Carlos"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2 text-sm">
                <span className="font-semibold">Apellido</span>
                <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                  <UserRound className="h-4 w-4 text-[var(--color-muted)]" />
                  <input
                    value={registerForm.lastName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 outline-none"
                    placeholder="Ramirez"
                    required
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="font-semibold">Cedula</span>
                <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                  <CreditCard className="h-4 w-4 text-[var(--color-muted)]" />
                  <input
                    value={registerForm.nationalId}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        nationalId: event.target.value.replace(/\D/g, ''),
                      }))
                    }
                    className="w-full px-3 py-3 outline-none"
                    placeholder="1032456789"
                    inputMode="numeric"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2 text-sm">
                <span className="font-semibold">Fecha de nacimiento</span>
                <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                  <CalendarDays className="h-4 w-4 text-[var(--color-muted)]" />
                  <input
                    type="date"
                    value={registerForm.birthDate}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        birthDate: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 outline-none"
                    required
                  />
                </div>
              </label>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Usuario generado automaticamente</span>
              <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[#f6efe7] px-4">
                <UserRound className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  value={usernamePreview}
                  readOnly
                  className="w-full px-3 py-3 text-[var(--color-muted)] outline-none"
                />
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Se forma con las 3 primeras letras del nombre, las 3 del apellido y los 3 ultimos numeros de la cedula.
              </p>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Contrasena</span>
              <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                <LockKeyhole className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-3 outline-none"
                  placeholder="Minimo 8 caracteres"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((current) => !current)}
                  className="text-[var(--color-muted)] transition hover:text-[var(--color-brand)]"
                >
                  {showRegisterPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          </>
        )}

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--color-success)]">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-deep)] disabled:opacity-60"
        >
          {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
