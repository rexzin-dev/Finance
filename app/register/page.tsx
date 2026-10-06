"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { translateAuthError, evaluatePasswordStrength } from "@/lib/security-utils";
import Link from "next/link";

export default function RegisterPage() {
  const supabase = getSupabaseBrowserClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordEvaluation = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !fullName.trim()) {
      setErrorMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // Verificar se as credenciais do Supabase estão configuradas
      const isPlaceholderConfigured =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project.supabase.co");

      if (isPlaceholderConfigured) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[CADASTRO DEBUG] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não estão configuradas no .env.local."
          );
        }
        setErrorMessage(
          "O serviço de autenticação do Supabase ainda não foi configurado. Configure seu .env.local com as credenciais do projeto."
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[CADASTRO DEBUG] Erro retornado pelo Supabase Auth:", error);
        }
        setErrorMessage(translateAuthError(error));
        setLoading(false);
        return;
      }

      // Se a sessão já foi gerada diretamente (email confirmation desligado no projeto)
      if (data.session) {
        window.location.href = "/";
      } else {
        // Exibir tela de confirmação de e-mail com instrução segura
        setIsSuccess(true);
        setLoading(false);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("[CADASTRO DEBUG] Exceção durante o cadastro:", err);
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

          <h1 className="text-xl font-bold tracking-tight text-slate-900">Criar nova conta</h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[280px]">
            Comece a organizar suas finanças com máxima privacidade e isolamento.
          </p>
        </div>

        {isSuccess ? (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Verifique seu e-mail</h2>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Enviamos uma mensagem para <strong>{email}</strong> para validar sua conta. Acesse o link para continuar.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-sm hover:bg-[#25468b]"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 animate-in fade-in"
              >
                <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              {/* Nome Completo */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700">
                  Nome completo
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 text-slate-400">
                    <User size={15} />
                  </div>
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                  E-mail
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 text-slate-400">
                    <Mail size={15} />
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-700">
                  Senha
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 text-slate-400">
                    <Lock size={15} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                    className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Indicador de Força de Senha */}
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordEvaluation.strength === "weak"
                            ? "bg-rose-500"
                            : passwordEvaluation.strength === "fair"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${passwordEvaluation.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Força: {passwordEvaluation.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700">
                  Confirmar senha
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 text-slate-400">
                    <Lock size={15} />
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-md shadow-blue-900/10 hover:bg-[#25468b] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all"
              >
                {loading ? (
                  <span>Criando conta...</span>
                ) : (
                  <>
                    <span>Criar conta</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs text-slate-500">
                Já possui uma conta?{" "}
                <Link href="/login" className="font-semibold text-[#3157a8] hover:underline">
                  Acessar conta
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
