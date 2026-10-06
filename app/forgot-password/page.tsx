"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAppAbsoluteUrl } from "@/lib/site-url";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setLoading(true);

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : getAppAbsoluteUrl("/reset-password");

      // Chamada oficial Supabase Auth para recuperação de senha
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectUrl,
      });
    } catch {
      // Intencionalmente suprime erros específicos para prevenir enumeração de contas
    } finally {
      setLoading(false);
      // Mensagem sempre neutra para evitar revelar existência ou não do e-mail
      setSubmitted(true);
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

          <h1 className="text-xl font-bold tracking-tight text-slate-900">Recuperar senha</h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[280px]">
            Informe o e-mail cadastrado para receber instruções de recuperação.
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-[#3157a8]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Instruções enviadas</h2>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Se existir uma conta associada ao e-mail informado, você receberá um link seguro para redefinir sua senha.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="recovery-email" className="block text-xs font-semibold text-slate-700">
                E-mail
              </label>
              <div className="relative mt-1.5">
                <input
                  id="recovery-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                />
                <div className="pointer-events-none absolute left-3 top-3.5 text-slate-400">
                  <Mail size={16} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-md shadow-blue-900/10 hover:bg-[#25468b] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all"
            >
              {loading ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <span>Enviar link de recuperação</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft size={13} />
                <span>Voltar ao login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
