'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CreditCard,
  Mail,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    nationalId: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  const maximumBirthDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 14);
    return date.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    const verificationState = searchParams.get('verified');
    const reason = searchParams.get('reason');

    if (verificationState === '1') {
      setMode('login');
      setMessage('Correo verificado correctamente. Ya puedes iniciar sesion.');
      setError(null);
      setSearchParams({}, { replace: true });
      return;
    }

    if (verificationState === '0') {
      setMode('login');
      setError(
        reason && reason !== 'token'
          ? decodeURIComponent(reason)
          : 'No fue posible validar el correo. Solicita un nuevo registro.',
      );
      setMessage(null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const registerValidationError = useMemo(() => {
    if (
      registerForm.birthDate &&
      new Date(registerForm.birthDate).getTime() >
        new Date(maximumBirthDate).getTime()
    ) {
      return 'Debes tener al menos 14 anos para crear la cuenta.';
    }

    if (
      registerForm.confirmPassword &&
      registerForm.password !== registerForm.confirmPassword
    ) {
      return 'La confirmacion de contrasena no coincide.';
    }

    return null;
  }, [
    maximumBirthDate,
    registerForm.birthDate,
    registerForm.confirmPassword,
    registerForm.password,
  ]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'register' && registerValidationError) {
      setError(registerValidationError);
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await login(loginForm);
      } else {
        const result = await register(registerForm);
        setLoginForm({
          identifier: result.email,
          password: '',
        });
        setRegisterForm({
          firstName: '',
          lastName: '',
          email: '',
          nationalId: '',
          birthDate: '',
          password: '',
          confirmPassword: '',
        });
        setMode('login');
        setMessage(
          result.delivery === 'EMAIL'
            ? `Cuenta creada correctamente. Revisa ${result.email} y valida tu correo para activar la cuenta.`
            : `Cuenta creada correctamente. No hay SMTP configurado, asi que el enlace de validacion quedo registrado en el servidor.`,
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
              <span className="font-semibold">Usuario o correo</span>
              <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                <UserRound className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  value={loginForm.identifier}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      identifier: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-3 outline-none"
                  placeholder="usuario o correo@dominio.com"
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
                <span className="font-semibold">Correo electronico</span>
                <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                  <Mail className="h-4 w-4 text-[var(--color-muted)]" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value.toLowerCase(),
                      }))
                    }
                    className="w-full px-3 py-3 outline-none"
                    placeholder="correo@dominio.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                  />
                </div>
              </label>

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
                    max={maximumBirthDate}
                    className="w-full px-3 py-3 outline-none"
                    required
                  />
                </div>
              </label>
            </div>

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

            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Confirmar contrasena</span>
              <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4">
                <LockKeyhole className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  type={showRegisterConfirmPassword ? 'text' : 'password'}
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-3 outline-none"
                  placeholder="Repite la contrasena"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowRegisterConfirmPassword((current) => !current)
                  }
                  className="text-[var(--color-muted)] transition hover:text-[var(--color-brand)]"
                >
                  {showRegisterConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            <p className="text-xs leading-6 text-[var(--color-muted)]">
              El usuario se sigue generando automaticamente, pero la activacion
              de la cuenta depende de la validacion del correo dentro de 24 horas.
            </p>
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
