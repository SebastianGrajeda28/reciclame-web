import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Recycle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw new Error(error.message);
      setSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#f7f8f6] px-6 py-6 text-slate-900 md:py-8">
      <span
        aria-hidden="true"
        className="absolute right-0 top-24 h-28 w-28 rounded-full bg-emerald-100/80 md:h-36 md:w-36"
      />

      <section className="mx-auto flex min-h-full max-w-[1180px] items-center justify-center">
        <article className="w-full max-w-[420px] rounded-[22px] border border-slate-200/80 bg-[#f8faf9] px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:px-10 md:py-10">
          <header className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Recycle className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Recíclame</p>
            <h1 className="mt-4 max-w-[260px] text-[28px] font-semibold leading-8 text-slate-900">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>
          </header>

          {sent ? (
            <aside className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Correo enviado. Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.</p>
            </aside>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="email" className="block space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Email
                </span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ariel@reciclame.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-lg border-slate-200 bg-white pl-9 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  />
                </span>
              </label>

              <Button
                type="submit"
                className="mt-2 h-10 w-full rounded-lg bg-[#0f2f45] text-sm font-semibold text-white hover:bg-[#143a53]"
                disabled={loading}
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          )}

          <footer className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </footer>
        </article>
      </section>
    </main>
  );
};

export default ForgotPassword;
