"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeInternalRedirect, translateAuthError } from "@/lib/security-utils";
import Link from "next/link";

export default function LoginPage() {
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Informe seu e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      // Verificar se as credenciais do Supabase estão configuradas
      const isPlaceholderConfigured =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project.supabase.co");

      if (isPlaceholderConfigured) {
        // MODO DESENVOLVIMENTO LOCAL (Sem Supabase Cloud configurado):
        // Permite entrar diretamente no sistema localmente com o perfil Admin
        console.warn(
          "[FLUXO LOCAL] Supabase Cloud ainda não conectado (.env.local ausente). Entrando em modo local com perfil Admin Master."
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "fluxo_current_user",
            JSON.stringify({
              id: "admin_master_local",
              email: normalizedEmail,
              full_name: "Jairo",
              role: "admin",
              is_master_admin: true,
            })
          );
          window.location.href = "/";
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[LOGIN DEBUG] Erro retornado pelo Supabase Auth:", error);
        }
        setErrorMessage(translateAuthError(error));
        setLoading(false);
        return;
      }

      if (data.user) {
        // Obter parâmetro redirect da URL com sanitização contra Open Redirect
        let redirectPath = "/";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          redirectPath = sanitizeInternalRedirect(params.get("redirect") || "/");
        }

        window.location.href = redirectPath;
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("[LOGIN DEBUG] Exceção durante login:", err);
      }
      setErrorMessage("Não foi possível conectar ao serviço de autenticação.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#f8fafc] p-4 sm:p-6 font-sans antialiased text-slate-800">
      <div className="w-full max-w-[420px] rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-900/5 transition-all">
        {/* Logo Fluxo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3157a8] text-white shadow-md shadow-blue-900/10 mb-4">
            <span className="text-xl font-bold tracking-tight">f</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900">Acesse sua conta</h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[280px]">
            Entre para acessar sua organização financeira com segurança.
          </p>
        </div>

        {/* Mensagem de Erro Neutra */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 animate-in fade-in"
          >
            <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulário Oficial */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
              E-mail
            </label>
            <div className="relative mt-1.5">
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden transition-all"
              />
              <div className="pointer-events-none absolute left-3 top-3.5 text-slate-400">
                <Mail size={16} />
              </div>
            </div>
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-[#3157a8] hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden transition-all"
              />
              <div className="pointer-events-none absolute left-3 top-3.5 text-slate-400">
                <Lock size={16} />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Opções: Manter conectado */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-[#3157a8] focus:ring-0 focus:outline-hidden"
              />
              <span className="text-xs text-slate-600">Manter conectado</span>
            </label>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-md shadow-blue-900/10 hover:bg-[#25468b] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all"
          >
            {loading ? (
              <span>Entrando...</span>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Rodapé / Link de Cadastro */}
        <div className="mt-7 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs text-slate-500">
            Não possui uma conta?{" "}
            <Link href="/register" className="font-semibold text-[#3157a8] hover:underline">
              Criar conta
            </Link>
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Protegido por Supabase Cloud com RLS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
