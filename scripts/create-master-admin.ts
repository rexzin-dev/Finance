/**
 * Script de Criação e Bootstrap do Primeiro Administrador Master do Fluxo
 *
 * Objetivo:
 * - Criar ou promover o primeiro usuário como Administrador Master (app_metadata: { role: 'admin', is_master_admin: true })
 * - Garantir criação idempotente (se já existir, apenas atualiza app_metadata e profiles)
 * - Garantir confirmação de e-mail (email_confirm: true)
 * - Não armazenar senhas ou segredos em logs
 *
 * Uso:
 *   npx tsx scripts/create-master-admin.ts email@exemplo.com
 *   ou com parâmetros opcionais via ENV:
 *   ADMIN_EMAIL=email@exemplo.com npx tsx scripts/create-master-admin.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Carregar variáveis do .env.local ou .env sem expor em produção
function loadEnvFile(filename: string) {
  const fullPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const targetEmail = (process.argv[2] || process.env.ADMIN_EMAIL)?.trim().toLowerCase();
const defaultName = process.env.ADMIN_NAME || "Jairo";
// Senha temporária fornecida nas especificações para o bootstrap seguro inicial
const tempPassword = process.env.ADMIN_PASSWORD || "Petruz@26";

if (!targetEmail) {
  console.error("\n❌ ERRO: Informe o e-mail do administrador.");
  console.log("Exemplo de uso:");
  console.log("  npx tsx scripts/create-master-admin.ts seu-email@dominio.com\n");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey || supabaseUrl.includes("placeholder-project.supabase.co")) {
  console.error("\n❌ ERRO: Variáveis de conexão do Supabase Cloud não configuradas.");
  console.error("Configure seu arquivo .env.local com:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co");
  console.error("  SUPABASE_SECRET_KEY=eyJhbGciOi...\n");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log(`\n====================================================`);
  console.log(`BOOTSTRAP DO ADMINISTRADOR MASTER — FLUXO`);
  console.log(`====================================================`);
  console.log(`E-mail: ${targetEmail}`);
  console.log(`Nome: ${defaultName}`);

  // 1. Verificar se usuário já existe
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Falha ao consultar Supabase Auth:", listError.message);
    process.exit(1);
  }

  const existingUser = users.find((u) => u.email?.toLowerCase() === targetEmail);

  let userId: string;

  if (existingUser) {
    console.log(`\nℹ️  Usuário já cadastrado encontrado (ID: ${existingUser.id}). Atualizando permissões...`);
    userId = existingUser.id;

    // Atualizar app_metadata e confirmar e-mail
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: {
        ...existingUser.user_metadata,
        full_name: defaultName,
      },
      app_metadata: {
        ...existingUser.app_metadata,
        role: "admin",
        is_master_admin: true,
      },
    });

    if (updateError) {
      console.error("❌ Erro ao atualizar usuário existente:", updateError.message);
      process.exit(1);
    }

    console.log("✅ Usuário já existia e foi promovido para administrador master com sucesso!");
  } else {
    console.log(`\nCriando novo usuário Administrador Master no Supabase Auth...`);

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: targetEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: defaultName,
      },
      app_metadata: {
        role: "admin",
        is_master_admin: true,
      },
    });

    if (createError) {
      console.error("❌ Erro ao criar usuário no Supabase Auth:", createError.message);
      process.exit(1);
    }

    userId = createData.user.id;
    console.log(`✅ Usuário criado com sucesso no Auth!`);
  }

  // 2. Garantir registro na tabela profiles
  console.log(`Sincronizando tabela pública profiles...`);
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: userId,
    full_name: defaultName,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn("⚠️ Aviso ao sincronizar profiles (pode ser criado via trigger):", profileError.message);
  } else {
    console.log("✅ Perfil sincronizado com sucesso na tabela profiles!");
  }

  console.log(`\n====================================================`);
  console.log(`🎉 ADMINISTRADOR MASTER CONFIGURADO COM SUCESSO!`);
  console.log(`   Usuário: ${targetEmail}`);
  console.log(`   Papel: Administrador Master (app_metadata.role="admin", is_master_admin=true)`);
  console.log(`   Acesso liberado a: Configurações > Usuários e Acessos`);
  console.log(`   ⚠️ AVISO: Altere a senha temporária em Configurações > Segurança após o primeiro acesso.`);
  console.log(`====================================================\n`);
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
