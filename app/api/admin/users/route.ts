import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAppAbsoluteUrl } from "@/lib/site-url";

export interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  status: "active" | "blocked" | "invited" | "unconfirmed";
  last_sign_in_at: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  is_banned: boolean;
}

/**
 * Validador rigoroso de autorização de Admin.
 * Verifica a sessão ativa do usuário que faz a requisição e checa se app_metadata.role === 'admin'.
 * NUNCA confia em parâmetros fornecidos pelo cliente.
 */
async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Não autorizado: token de autorização ausente.", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const serverClient = getSupabaseServerClient();
  const { data: { user }, error } = await serverClient.auth.getUser(token);

  if (error || !user) {
    return { error: "Sessão inválida ou expirada.", status: 401 };
  }

  const role = user.app_metadata?.role;
  if (role !== "admin") {
    return { error: "Acesso negado: privilégios de Administrador são obrigatórios.", status: 403 };
  }

  return { adminUser: user };
}

// GET: Listar todos os usuários com dados reais de autenticação e perfis
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      // Modo de demonstração segura quando SUPABASE_SERVICE_ROLE_KEY ainda não foi definida em dev
      return NextResponse.json({
        users: [
          {
            id: authResult.adminUser.id,
            email: authResult.adminUser.email || "admin@fluxo.app",
            full_name: (authResult.adminUser.user_metadata?.full_name as string) || "Administrador Fluxo",
            role: "admin",
            status: "active",
            last_sign_in_at: authResult.adminUser.last_sign_in_at || new Date().toISOString(),
            created_at: authResult.adminUser.created_at || new Date().toISOString(),
            email_confirmed_at: authResult.adminUser.email_confirmed_at || new Date().toISOString(),
            is_banned: false,
          },
        ],
        warning: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Exibindo sessão admin atual.",
      });
    }

    // Buscar lista oficial de auth.users via Supabase Admin API
    const { data: { users: authUsers }, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      return NextResponse.json({ error: "Falha ao consultar usuários: " + listError.message }, { status: 500 });
    }

    // Buscar perfis associados para nomes completos atualizados
    const { data: profiles } = await adminClient.from("profiles").select("id, full_name");
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

    const mappedUsers: ManagedUser[] = authUsers.map((u) => {
      const isBanned = Boolean(u.banned_until && new Date(u.banned_until) > new Date());
      const role = (u.app_metadata?.role as "admin" | "user") || "user";
      
      let status: ManagedUser["status"] = "active";
      if (isBanned) {
        status = "blocked";
      } else if (u.invited_at && !u.confirmed_at && !u.last_sign_in_at) {
        status = "invited";
      } else if (!u.email_confirmed_at && !u.confirmed_at) {
        status = "unconfirmed";
      }

      return {
        id: u.id,
        email: u.email || "",
        full_name: profileMap.get(u.id) || (u.user_metadata?.full_name as string) || (u.email?.split("@")[0] ?? "Usuário"),
        role,
        status,
        last_sign_in_at: u.last_sign_in_at || null,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at || null,
        is_banned: isBanned,
      };
    });

    return NextResponse.json({ users: mappedUsers });
  } catch (err: any) {
    return NextResponse.json({ error: "Erro interno no servidor ao listar usuários." }, { status: 500 });
  }
}

// POST: Convidar novo usuário por e-mail ou executar ações administrativas
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente seguro do servidor." },
        { status: 500 }
      );
    }

    const body: any = await req.json();
    const { action, email, full_name, role = "user", target_user_id } = body;

    // Ação 1: CONVIDAR USUÁRIO POR E-MAIL
    if (action === "invite") {
      if (!email || !email.includes("@")) {
        return NextResponse.json({ error: "E-mail inválido para convite." }, { status: 400 });
      }

      const assignedRole = role === "admin" ? "admin" : "user";
      const redirectTo = getAppAbsoluteUrl("/reset-password");

      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        email.trim().toLowerCase(),
        {
          redirectTo,
          data: {
            full_name: full_name?.trim() || "",
          },
        }
      );

      if (inviteErr) {
        return NextResponse.json({ error: inviteErr.message }, { status: 400 });
      }

      // Atribuir papel seguro em app_metadata e salvar perfil
      if (inviteData?.user) {
        await adminClient.auth.admin.updateUserById(inviteData.user.id, {
          app_metadata: { role: assignedRole },
        });

        await adminClient.from("profiles").upsert({
          id: inviteData.user.id,
          full_name: full_name?.trim() || "",
        });

        // Registrar auditoria
        await logAdminAction(adminClient, authResult.adminUser.id, inviteData.user.id, "invite_user", {
          email,
          role: assignedRole,
        });
      }

      return NextResponse.json({ success: true, message: "Convite enviado com sucesso!" });
    }

    // Ação 2: ALTERAR PAPEL (ADMIN <-> USUÁRIO)
    if (action === "change_role") {
      if (!target_user_id) {
        return NextResponse.json({ error: "Identificador do usuário alvo é obrigatório." }, { status: 400 });
      }

      const targetRole = role === "admin" ? "admin" : "user";

      // Buscar dados do usuário alvo para checar se é Master Admin
      const { data: targetData } = await adminClient.auth.admin.getUserById(target_user_id);
      const isMasterAdmin = Boolean(targetData?.user?.app_metadata?.is_master_admin);

      if (isMasterAdmin && targetRole !== "admin") {
        return NextResponse.json(
          { error: "Operação bloqueada: o Administrador Master não pode ser rebaixado para usuário comum." },
          { status: 400 }
        );
      }

      // PROTEÇÃO CRÍTICA: Se for rebaixar um admin para usuário comum, verificar se não é o último admin!
      if (targetRole === "user") {
        const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
        const activeAdmins = (allUsers || []).filter(
          (u) => u.app_metadata?.role === "admin" && (!u.banned_until || new Date(u.banned_until) <= new Date())
        );

        if (activeAdmins.length <= 1 && activeAdmins.some((u) => u.id === target_user_id)) {
          return NextResponse.json(
            { error: "Operação bloqueada: não é permitido rebaixar o único Administrador ativo do sistema." },
            { status: 400 }
          );
        }
      }

      const { error: updateErr } = await adminClient.auth.admin.updateUserById(target_user_id, {
        app_metadata: {
          ...targetData?.user?.app_metadata,
          role: targetRole,
        },
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      await logAdminAction(adminClient, authResult.adminUser.id, target_user_id, "change_role", {
        new_role: targetRole,
      });

      return NextResponse.json({ success: true, message: `Perfil alterado para ${targetRole === "admin" ? "Administrador" : "Usuário"}.` });
    }

    // Ação 3: BLOQUEAR ACESSO
    if (action === "block") {
      if (!target_user_id) {
        return NextResponse.json({ error: "Identificador do usuário alvo é obrigatório." }, { status: 400 });
      }

      // Buscar usuário alvo
      const { data: targetData } = await adminClient.auth.admin.getUserById(target_user_id);
      const isMasterAdmin = Boolean(targetData?.user?.app_metadata?.is_master_admin);

      if (isMasterAdmin) {
        return NextResponse.json(
          { error: "Operação bloqueada: o Administrador Master não pode ser bloqueado." },
          { status: 400 }
        );
      }

      // PROTEÇÃO CRÍTICA: Não permitir bloquear a si mesmo ou o último admin
      if (target_user_id === authResult.adminUser.id) {
        return NextResponse.json({ error: "Você não pode bloquear a sua própria conta de administrador." }, { status: 400 });
      }

      // Banir por 100 anos no Supabase Auth
      const banUntil = new Date();
      banUntil.setFullYear(banUntil.getFullYear() + 100);

      const { error: banErr } = await adminClient.auth.admin.updateUserById(target_user_id, {
        ban_duration: "876000h", // ~100 anos
      });

      if (banErr) {
        return NextResponse.json({ error: banErr.message }, { status: 400 });
      }

      await logAdminAction(adminClient, authResult.adminUser.id, target_user_id, "block_user");

      return NextResponse.json({ success: true, message: "Acesso do usuário bloqueado." });
    }

    // Ação 4: REATIVAR / DESBLOQUEAR ACESSO
    if (action === "unblock") {
      if (!target_user_id) {
        return NextResponse.json({ error: "Identificador do usuário alvo é obrigatório." }, { status: 400 });
      }

      const { error: unbanErr } = await adminClient.auth.admin.updateUserById(target_user_id, {
        ban_duration: "none",
      });

      if (unbanErr) {
        return NextResponse.json({ error: unbanErr.message }, { status: 400 });
      }

      await logAdminAction(adminClient, authResult.adminUser.id, target_user_id, "unblock_user");

      return NextResponse.json({ success: true, message: "Acesso reativado com sucesso." });
    }

    // Ação 5: ENVIAR LINK DE REDEFINIÇÃO DE SENHA
    if (action === "send_password_reset") {
      if (!email) {
        return NextResponse.json({ error: "E-mail do usuário é obrigatório." }, { status: 400 });
      }

      const redirectTo = getAppAbsoluteUrl("/reset-password");
      const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 400 });
      }

      await logAdminAction(adminClient, authResult.adminUser.id, target_user_id || email, "send_password_reset");

      return NextResponse.json({ success: true, message: "Link de redefinição de senha enviado ao e-mail do usuário." });
    }

    return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Erro interno no servidor ao processar ação administrativa." }, { status: 500 });
  }
}

// Helper para gravação de log de auditoria seguro sem senhas ou tokens
async function logAdminAction(adminClient: any, actorId: string, targetId: string, action: string, metadata: any = {}) {
  try {
    await adminClient.from("admin_audit_logs").insert({
      actor_user_id: actorId,
      target_user_id: targetId,
      action,
      metadata,
    });
  } catch (e) {
    // Auditoria não quebra a operação principal se a tabela ainda não estiver criada
    console.info(`[AUDIT] Actor: ${actorId} | Action: ${action} | Target: ${targetId}`);
  }
}
