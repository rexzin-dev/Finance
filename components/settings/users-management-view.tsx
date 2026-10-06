"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  Lock,
  Unlock,
  Mail,
  UserCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { ManagedUser } from "@/app/api/admin/users/route";

export function UsersManagementView() {
  const supabase = getSupabaseBrowserClient();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked" | "invited" | "unconfirmed">("all");

  // Modal Novo Usuário (Convite)
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Menu de Ações por Usuário
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Diálogo de confirmação para ações críticas
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    confirmLabel: string;
    variant?: "default" | "danger";
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
    confirmLabel: "Confirmar",
  });

  // Carregar lista de usuários da rota segura da API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const json: any = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Não foi possível carregar a lista de usuários.");
      }

      setUsers(json.users || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Enviar convite seguro por e-mail
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Informe um endereço de e-mail válido.");
      return;
    }

    setSubmittingInvite(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-TransType": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          action: "invite",
          email: inviteEmail.trim().toLowerCase(),
          full_name: inviteName.trim(),
          role: inviteRole,
        }),
      });

      const json: any = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao enviar convite.");
      }

      toast.success("Convite enviado com sucesso!");
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("user");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar convite.");
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Alterar papel do usuário (Admin <-> Usuário)
  const handleChangeRole = (user: ManagedUser) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const label = newRole === "admin" ? "Administrador" : "Usuário Comum";

    setConfirmDialog({
      isOpen: true,
      title: `Alterar papel para ${label}?`,
      description: `O usuário ${user.full_name || user.email} terá permissões de ${label}.`,
      confirmLabel: "Alterar papel",
      action: async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;

          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              action: "change_role",
              target_user_id: user.id,
              role: newRole,
            }),
          });

          const json: any = await res.json();
          if (!res.ok) throw new Error(json.error);

          toast.success(json.message);
          fetchUsers();
        } catch (err: any) {
          toast.error(err.message || "Não foi possível alterar o papel.");
        }
      },
    });
  };

  // Bloquear ou Reativar acesso
  const handleToggleBlock = (user: ManagedUser) => {
    const isBlocking = user.status !== "blocked";

    setConfirmDialog({
      isOpen: true,
      title: isBlocking ? "Bloquear acesso do usuário?" : "Reativar acesso do usuário?",
      description: isBlocking
        ? `O usuário ${user.full_name || user.email} não conseguirá mais realizar login no sistema.`
        : `O acesso de ${user.full_name || user.email} será restaurado imediatamente.`,
      confirmLabel: isBlocking ? "Bloquear usuário" : "Reativar acesso",
      variant: isBlocking ? "danger" : "default",
      action: async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;

          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              action: isBlocking ? "block" : "unblock",
              target_user_id: user.id,
            }),
          });

          const json: any = await res.json();
          if (!res.ok) throw new Error(json.error);

          toast.success(json.message);
          fetchUsers();
        } catch (err: any) {
          toast.error(err.message || "Falha na operação.");
        }
      },
    });
  };

  // Enviar link de redefinição de senha
  const handleSendPasswordReset = (user: ManagedUser) => {
    setConfirmDialog({
      isOpen: true,
      title: "Enviar link de redefinição de senha?",
      description: `Um e-mail de recuperação seguro será enviado para ${user.email}. O administrador não terá acesso à nova senha.`,
      confirmLabel: "Enviar link",
      action: async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;

          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              action: "send_password_reset",
              target_user_id: user.id,
              email: user.email,
            }),
          });

          const json: any = await res.json();
          if (!res.ok) throw new Error(json.error);

          toast.success(json.message);
        } catch (err: any) {
          toast.error(err.message || "Erro ao solicitar redefinição.");
        }
      },
    });
  };

  // Filtragem no cliente para resposta instantânea
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção com Ação Principal Alinhada à Direita */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Usuários e Acessos</h3>
          <p className="text-xs text-slate-500">
            Gerencie os usuários do sistema, permissões administrativas e status de acesso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="gap-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            className="gap-1.5 rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
          >
            <UserPlus size={14} />
            + Novo usuário
          </Button>
        </div>
      </div>

      {/* Barra de Filtros Compacta */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos os perfis</option>
            <option value="admin">Administrador</option>
            <option value="user">Usuário</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
            <option value="invited">Convite pendente</option>
            <option value="unconfirmed">E-mail não confirmado</option>
          </select>
        </div>
      </div>

      {/* Tabela Elegante e Compacta */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4">Criado em</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3157a8] border-t-transparent" />
                      <span>Carregando usuários com segurança...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                          {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                            : "bg-slate-100 text-slate-600 border border-slate-200/60"
                        }`}
                      >
                        <Shield size={10} />
                        {u.role === "admin" ? "Administrador" : "Usuário"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : u.status === "blocked"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                            : u.status === "invited"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-slate-100 text-slate-600 border border-slate-200/60"
                        }`}
                      >
                        {u.status === "active" && <CheckCircle2 size={10} />}
                        {u.status === "blocked" && <XCircle size={10} />}
                        {u.status === "invited" && <Clock size={10} />}
                        {u.status === "unconfirmed" && <AlertTriangle size={10} />}
                        {u.status === "active"
                          ? "Ativo"
                          : u.status === "blocked"
                          ? "Bloqueado"
                          : u.status === "invited"
                          ? "Convite pendente"
                          : "E-mail não confirmado"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {u.last_sign_in_at ? (
                        new Date(u.last_sign_in_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-slate-400">Nunca acessou</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {new Date(u.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeMenuId === u.id && (
                          <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg shadow-slate-900/10">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleChangeRole(u);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <Shield size={13} className="text-slate-400" />
                              {u.role === "admin" ? "Tornar Usuário" : "Tornar Admin"}
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleSendPasswordReset(u);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <KeyRound size={13} className="text-slate-400" />
                              Enviar redefinição de senha
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleToggleBlock(u);
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                                u.status === "blocked"
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              {u.status === "blocked" ? (
                                <>
                                  <Unlock size={13} />
                                  Reativar acesso
                                </>
                              ) : (
                                <>
                                  <Lock size={13} />
                                  Bloquear acesso
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Convidar Novo Usuário */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Convidar novo usuário</h3>
            <p className="mt-1 text-xs text-slate-400">
              O usuário receberá um e-mail oficial para ativar sua conta e definir sua senha pessoal.
            </p>

            <form onSubmit={handleSendInvite} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700">Nome completo</label>
                <input
                  type="text"
                  placeholder="Ex.: João Silva"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">E-mail *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Perfil de acesso</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="user">Usuário Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInviteModalOpen(false)}
                  disabled={submittingInvite}
                  className="rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingInvite}
                  className="rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  {submittingInvite ? "Enviando convite..." : "Enviar convite"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmação Reutilizável */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel="Cancelar"
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
