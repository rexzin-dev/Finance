import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Retorna o cliente oficial do Supabase para execução no navegador.
 * Utiliza exclusivamente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Gerencia a sessão em cookies e memória de forma segura.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    // Modo fallback seguro caso variáveis de ambiente ainda não tenham sido configuradas
    console.warn(
      "Fluxo: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não encontradas. Configure seu .env.local com os dados do Supabase Cloud."
    );
  }

  browserClient = createClient(
    url || "https://placeholder-project.supabase.co",
    publishableKey || "placeholder-anon-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "fluxo_auth_session",
      },
    }
  );

  return browserClient;
}
