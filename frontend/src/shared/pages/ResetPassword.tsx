import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Recycle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      toast.success("Contraseña actualizada correctamente");
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar la contraseña");
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
              Nueva contraseña
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Elige una contraseña segura para tu cuenta.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="password" className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                Contraseña
              </span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border-slate-200 bg-white pl-9 pr-10 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label htmlFor="confirm" className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                Confirmar contraseña
              </span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        </article>
      </section>
    </main>
  );
};

export default ResetPassword;
