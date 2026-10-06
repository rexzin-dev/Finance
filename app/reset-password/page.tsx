"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { translateAuthError, evaluatePasswordStrength } from "@/lib/security-utils";
import Link from "next/link";

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Verificar se o usuário possui sessão de recuperação originada do link do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasValidSession(!!session);
      setCheckingSession(false);
    });
  }, [supabase]);

  const passwordEvaluation = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(translateAuthError(error));
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      setLoading(false);
    } catch {
      setErrorMessage("Não foi possível atualizar sua senha. Tente novamente.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8fafc] text-xs text-slate-400">
        Validando link de recuperação...
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#f8fafc] p-4 sm:p-6 font-sans antialiased text-slate-800">
      <div className="w-full max-w-[420px] rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-900/5 transition-all">
        {/* Logo Fluxo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3157a8] text-white shadow-md shadow-blue-900/10 mb-4">
            <span className="text-xl font-bold tracking-tight">f</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900">Redefinir senha</h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[280px]">
            Crie uma nova senha segura para sua conta Fluxo.
          </p>
        </div>

        {isSuccess ? (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Senha atualizada com sucesso!</h2>
              <p className="mt-1 text-xs text-slate-500">
                Você já pode acessar sua conta utilizando sua nova credencial.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-sm hover:bg-[#25468b]"
            >
              Ir para o login
            </Link>
          </div>
        ) : !hasValidSession ? (
          <div className="mt-6 text-center space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              O link de recuperação expirou ou é inválido. Solicite um novo link de redefinição.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-sm hover:bg-[#25468b]"
            >
              Solicitar nova recuperação
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 animate-in fade-in"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="reset-pass" className="block text-xs font-semibold text-slate-700">
                Nova senha
              </label>
              <div className="relative mt-1.5">
                <input
                  id="reset-pass"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                />
                <div className="pointer-events-none absolute left-3 top-3.5 text-slate-400">
                  <Lock size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

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

            <div>
              <label htmlFor="reset-confirm" className="block text-xs font-semibold text-slate-700">
                Confirmar nova senha
              </label>
              <div className="relative mt-1.5">
                <input
                  id="reset-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3157a8] focus:ring-2 focus:ring-[#3157a8]/10 focus:outline-hidden"
                />
                <div className="pointer-events-none absolute left-3 top-3.5 text-slate-400">
                  <Lock size={16} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3157a8] text-xs font-semibold text-white shadow-md shadow-blue-900/10 hover:bg-[#25468b] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all"
            >
              {loading ? (
                <span>Atualizando senha...</span>
              ) : (
                <>
                  <span>Salvar nova senha</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
