/**
 * Script de Bootstrap do Primeiro Administrador do Fluxo
 * 
 * Uso:
 *   npx tsx scripts/set-admin.ts email@exemplo.com
 *
 * Requisitos:
 *   - Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY configuradas em .env.local ou no ambiente.
 *   - O usuário com o e-mail informado já deve existir no Supabase Auth (criado via /register ou convite).
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Leitor simples de .env.local sem dependência externa
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

const targetEmail = process.argv[2]?.trim().toLowerCase();

if (!targetEmail) {
  console.error("\n❌ ERRO: Informe o e-mail do usuário.");
  console.log("Exemplo de uso:");
  console.log("  npx tsx scripts/set-admin.ts email@dominio.com\n");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("\n❌ ERRO: Variáveis de ambiente incompletas.");
  console.error("Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY estão definidas no seu .env.local.\n");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log(`\n🔍 Buscando usuário pelo e-mail: ${targetEmail}...`);

  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Falha ao consultar usuários:", listError.message);
    process.exit(1);
  }

  const user = users.find((u) => u.email?.toLowerCase() === targetEmail);

  if (!user) {
    console.error(`❌ Usuário com o e-mail "${targetEmail}" não foi encontrado no Supabase Auth.`);
    console.error("Crie a conta primeiro no sistema (/register ou /login) e execute este script novamente.\n");
    process.exit(1);
  }

  console.log(`👤 Usuário encontrado: ${user.id} (${user.email})`);
  console.log(`🔐 Papel atual em app_metadata: ${JSON.stringify(user.app_metadata || {})}`);

  console.log(`⚙️  Atualizando app_metadata.role para "admin"...`);

  const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "admin",
    },
  });

  if (updateError) {
    console.error("❌ Erro ao atualizar permissão:", updateError.message);
    process.exit(1);
  }

  console.log("\n✅ SUCESSO!");
  console.log(`🎉 O usuário ${targetEmail} agora é ADMINISTRADOR oficial do Fluxo.`);
  console.log(`   ID: ${updatedUser.user.id}`);
  console.log(`   app_metadata: ${JSON.stringify(updatedUser.user.app_metadata)}\n`);
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
