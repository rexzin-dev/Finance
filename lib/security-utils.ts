/**
 * Validador de caminhos internos para prevenir ataques de Open Redirect.
 * Rejeita esquemas externos, barras duplas e protocolos arbitrários (ex: javascript:, https:).
 */
export function sanitizeInternalRedirect(returnTo: string | null | undefined, defaultPath = "/"): string {
  if (!returnTo) return defaultPath;

  const trimmed = returnTo.trim();

  // Precisa começar com "/" e NÃO começar com "//" ou "/\" e não conter ":" nem "\\"
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\") && !trimmed.includes(":") && !trimmed.includes("\\")) {
    return trimmed;
  }

  return defaultPath;
}

/**
 * Traduz mensagens técnicas de autenticação do Supabase para mensagens amigáveis em pt-BR
 * sem revelar detalhes da infraestrutura ou enumeração de contas.
 */
export function translateAuthError(error: any): string {
  if (!error) return "Ocorreu um erro inesperado. Tente novamente.";

  const message = String(error.message || error).toLowerCase();

  if (message.includes("invalid login credentials") || message.includes("invalid_grant")) {
    return "E-mail ou senha inválidos.";
  }

  if (message.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (message.includes("user already registered") || message.includes("user_already_exists")) {
    return "Não foi possível concluir o cadastro com este e-mail.";
  }

  if (message.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  if (message.includes("rate limit") || message.includes("too many requests") || message.includes("over_email_send_rate_limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.";
  }

  if (message.includes("network") || message.includes("fetch failed")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

/**
 * Indicador de força de senha baseado em comprimento e diversidade básica
 */
export type PasswordStrength = "weak" | "fair" | "good";

export function evaluatePasswordStrength(password: string): {
  strength: PasswordStrength;
  label: string;
  percentage: number;
} {
  if (!password || password.length < 6) {
    return { strength: "weak", label: "Fraca", percentage: 25 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) score += 1;

  if (score <= 1) {
    return { strength: "weak", label: "Fraca", percentage: 40 };
  }
  if (score <= 2) {
    return { strength: "fair", label: "Razoável", percentage: 70 };
  }
  return { strength: "good", label: "Boa", percentage: 100 };
}
