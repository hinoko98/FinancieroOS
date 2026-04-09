import { LoginHero } from '@/features/auth/components/login-hero';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[40px] bg-[linear-gradient(180deg,#6f4e37,#4f3527)] p-12 text-[#fff8f1] shadow-[var(--shadow-panel)]">
          <LoginHero />
        </section>

        <div className="flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
