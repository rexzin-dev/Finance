"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UsersManagementView } from "@/components/settings/users-management-view";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Toaster } from "sonner";

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login?redirect=/admin/users");
        return;
      }

      // Validar role em app_metadata
      const role = session.user.app_metadata?.role;
      if (role === "admin") {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    });
  }, [router, supabase]);

  if (authorized === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3157a8] border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Verificando autorização administrativa...</span>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8fafc] p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-lg">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600 mb-3">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-800">Acesso Restrito</h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Você não possui permissão de Administrador para acessar o gerenciamento de usuários do sistema.
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
            >
              <ArrowLeft size={14} />
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao painel principal
          </Link>
        </div>

        <UsersManagementView />
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
