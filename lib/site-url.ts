/**
 * Helper central para resolução padronizada de URLs da aplicação.
 * Prioridade:
 * 1. NEXT_PUBLIC_SITE_URL (definido pelo desenvolvedor ou na Vercel)
 * 2. VERCEL_URL / NEXT_PUBLIC_VERCEL_URL (fornecido automaticamente pela Vercel em preview/produção)
 * 3. Fallback seguro para http://localhost:4000 em ambiente de desenvolvimento local
 */
export function getAppSiteUrl(): string {
  let siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;

  if (siteUrl) {
    siteUrl = siteUrl.trim();
    // Adicionar protocolo https:// caso seja um domínio Vercel puro (ex: fluxo.vercel.app)
    if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
      siteUrl = `https://${siteUrl}`;
    }
    // Remover barra final
    return siteUrl.replace(/\/+$/, "");
  }

  // Fallback padrão para ambiente de desenvolvimento local
  return "http://localhost:4000";
}

/**
 * Retorna uma URL absoluta segura para rotas internas (ex: callbacks de auth, reset, convite)
 */
export function getAppAbsoluteUrl(path: string): string {
  const baseUrl = getAppSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
