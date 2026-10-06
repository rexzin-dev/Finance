"use client";

import React, { useState } from "react";
import { Plus, Tag, User, Shield, Sliders, Edit2, Trash2, Users, KeyRound, Check, Laptop } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UsersManagementView } from "./users-management-view";
import type { Category, TransactionType } from "@/lib/types";

export function SettingsView() {
  const { user, categories, addCategory, updateCategory, removeCategory, updateUserProfile } = useFinance();
  const [activeTab, setActiveTab] = useState<"categories" | "profile" | "preferences" | "security" | "users">("categories");

  // Perfil
  const [profileName, setProfileName] = useState(user.full_name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Segurança - Alterar senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Categorias
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TransactionType | "both">("both");
  const [color, setColor] = useState("#2563eb");
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);

  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setKind(cat.kind || "both");
      setColor(cat.color || "#2563eb");
    } else {
      setEditingCategory(null);
      setName("");
      setKind("both");
      setColor("#2563eb");
    }
    setModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    if (editingCategory) {
      updateCategory({
        id: editingCategory.id,
        name: name.trim(),
        kind: kind === "both" ? null : kind,
        color,
      });
      toast.success("Categoria atualizada com sucesso.");
    } else {
      addCategory({
        name: name.trim(),
        kind: kind === "both" ? null : kind,
        color,
      });
      toast.success("Categoria criada com sucesso.");
    }
    setModalOpen(false);
  };

  const handleDeleteCategory = () => {
    if (catToDelete) {
      removeCategory(catToDelete.id);
      toast.success("Categoria removida.");
      setCatToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Configurações</h2>
        <p className="text-xs text-slate-500">
          Gerencie seu perfil, preferências da conta e categorias personalizadas.
        </p>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "categories"
              ? "border-[#3157a8] text-[#3157a8]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Tag size={14} />
          Categorias
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "profile"
              ? "border-[#3157a8] text-[#3157a8]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <User size={14} />
          Perfil
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "preferences"
              ? "border-[#3157a8] text-[#3157a8]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sliders size={14} />
          Preferências
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "security"
              ? "border-[#3157a8] text-[#3157a8]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield size={14} />
          Segurança
        </button>

        {/* Aba Usuários e Acessos: Visível ESTRITAMENTE para Administradores */}
        {user.role === "admin" && (
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "users"
                ? "border-[#3157a8] text-[#3157a8]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users size={14} />
            Usuários e Acessos
          </button>
        )}
      </div>

      {/* Conteúdo da Aba Categorias */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Categorias utilizadas para classificar e orçar receitas e despesas.
            </p>
            <Button
              size="sm"
              onClick={() => handleOpenCategoryModal()}
              className="gap-1.5 rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
            >
              <Plus size={15} />
              Nova categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: c.color || "#3157a8" }}
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{c.name}</h5>
                    <span className="text-[10px] text-slate-400">
                      {c.kind === "income"
                        ? "Receitas"
                        : c.kind === "expense"
                        ? "Despesas"
                        : "Receitas & Despesas"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleOpenCategoryModal(c)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => setCatToDelete(c)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Perfil */}
      {activeTab === "profile" && (
        <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800">Dados do Perfil</h4>
          <p className="mt-1 text-xs text-slate-400">
            Atualize suas informações pessoais visíveis no sistema.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingProfile(true);
              try {
                await updateUserProfile({ full_name: profileName.trim() });
                toast.success("Perfil atualizado com sucesso!");
              } catch (err: any) {
                toast.error("Erro ao atualizar perfil.");
              } finally {
                setSavingProfile(false);
              }
            }}
            className="mt-4 space-y-4 text-xs"
          >
            <div>
              <label className="font-medium text-slate-700">Nome completo</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Seu nome"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700">E-mail</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                A alteração de e-mail requer confirmação de segurança via link oficial.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={savingProfile}
                className="gap-1.5 rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
              >
                <Check size={14} />
                {savingProfile ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Conteúdo da Aba Preferências */}
      {activeTab === "preferences" && (
        <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800">Moeda e Localização</h4>
          <p className="mt-1 text-xs text-slate-500">
            Padrão estabelecido: <strong>Real Brasileiro (BRL - R$)</strong> com formato 24 horas.
          </p>
        </div>
      )}

      {/* Conteúdo da Aba Segurança */}
      {activeTab === "security" && (
        <div className="space-y-5 max-w-xl">
          {/* Seção: Alterar Senha do Próprio Usuário */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-[#3157a8]" />
              <h4 className="text-sm font-bold text-slate-800">Alterar senha</h4>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Defina uma nova senha para sua conta usando o fluxo oficial criptografado do Supabase.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newPassword.length < 6) {
                  toast.error("A nova senha deve possuir pelo menos 6 caracteres.");
                  return;
                }
                if (newPassword !== confirmNewPassword) {
                  toast.error("A confirmação de senha não confere.");
                  return;
                }

                setChangingPassword(true);
                try {
                  const supabase = getSupabaseBrowserClient();
                  const { error } = await supabase.auth.updateUser({
                    password: newPassword,
                  });
                  if (error) throw error;

                  toast.success("Senha alterada com sucesso!");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                } catch (err: any) {
                  toast.error(err.message || "Erro ao alterar a senha.");
                } finally {
                  setChangingPassword(false);
                }
              }}
              className="mt-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="font-medium text-slate-700">Nova senha</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo de 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Confirmar nova senha</label>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={changingPassword}
                  className="rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  {changingPassword ? "Atualizando senha..." : "Salvar nova senha"}
                </Button>
              </div>
            </form>
          </div>

          {/* Seção: Autenticação em Duas Etapas (MFA) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Autenticação em duas etapas (MFA)</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Adicione uma camada extra de proteção utilizando um aplicativo autenticador TOTP.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Desativada
              </span>
            </div>
          </div>

          {/* Seção: Sessões Conectadas */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Laptop size={16} className="text-slate-500" />
              <h4 className="text-sm font-bold text-slate-800">Sessão Atual</h4>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Conectado neste dispositivo com controle estrito de Row Level Security (RLS).
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Usuários e Acessos (Apenas Admin) */}
      {activeTab === "users" && user.role === "admin" && (
        <UsersManagementView />
      )}

      {/* Modal Categoria */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {editingCategory ? "Editar categoria" : "Nova categoria"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Defina o nome, cor e aplicação da categoria.
            </p>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700">Nome da categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Supermercado, Salário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Tipo permitido</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="both">Receitas e Despesas</option>
                  <option value="expense">Apenas Despesas</option>
                  <option value="income">Apenas Receitas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Cor de destaque</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                  />
                  <span className="font-mono text-xs text-slate-500">{color}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Salvar categoria
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!catToDelete}
        title="Excluir categoria?"
        description="Esta categoria será removida da lista. Lançamentos anteriores permanecerão seguros."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
}
