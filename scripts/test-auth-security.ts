/**
 * FLUXO - Automated Auth & Security Unit Test Suite
 * Tests deterministic security mechanisms:
 * 1. Open Redirect defense (sanitizeInternalRedirect)
 * 2. Password Strength Evaluation (evaluatePasswordStrength)
 * 3. Auth Error Neutrality & Obfuscation (translateAuthError)
 * 4. User ID Spoofing / Tampering detection (IDOR concept verification)
 * 5. Role-Based Access Control (RBAC) - Admin vs Common User
 * 6. Protection of the Last System Administrator
 */

import { sanitizeInternalRedirect, evaluatePasswordStrength, translateAuthError } from '../lib/security-utils';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('====================================================');
console.log('INICIANDO SUÍTE DE TESTES DE SEGURANÇA E AUTENTICAÇÃO');
console.log('====================================================\n');

// 1. OPEN REDIRECT DEFENSE TESTS
console.log('--- Testando Proteção contra Open Redirect ---');
assert(
  sanitizeInternalRedirect(null, '/dashboard') === '/dashboard',
  'Redirecionamento nulo deve ir para /dashboard padrão'
);
assert(
  sanitizeInternalRedirect('', '/dashboard') === '/dashboard',
  'Redirecionamento vazio deve ir para /dashboard padrão'
);
assert(
  sanitizeInternalRedirect('/cartoes', '/dashboard') === '/cartoes',
  'Caminho interno seguro "/cartoes" deve ser preservado'
);
assert(
  sanitizeInternalRedirect('/lancamentos?filtro=hoje', '/dashboard') === '/lancamentos?filtro=hoje',
  'Caminho interno com query string "/lancamentos?filtro=hoje" deve ser preservado'
);
assert(
  sanitizeInternalRedirect('https://evil-hacker.com', '/dashboard') === '/dashboard',
  'Tentativa de redirect externo com protocolo "https://" deve ser bloqueada'
);
assert(
  sanitizeInternalRedirect('http://attacker.com/steal', '/dashboard') === '/dashboard',
  'Tentativa de redirect externo com protocolo "http://" deve ser bloqueada'
);
assert(
  sanitizeInternalRedirect('//evil.com', '/dashboard') === '/dashboard',
  'Tentativa de protocol-relative redirect "//evil.com" deve ser bloqueada'
);
assert(
  sanitizeInternalRedirect('/\\evil.com', '/dashboard') === '/dashboard',
  'Tentativa de bypass com backslash "/\\evil.com" deve ser bloqueada'
);
assert(
  sanitizeInternalRedirect('javascript:alert(1)', '/dashboard') === '/dashboard',
  'Tentativa de URI XSS "javascript:" deve ser bloqueada'
);

// 2. PASSWORD STRENGTH EVALUATOR TESTS
console.log('\n--- Testando Avaliação de Força de Senha ---');
const weakPass = evaluatePasswordStrength('12345');
assert(weakPass.strength === 'weak', 'Senha menor que 6 caracteres deve ser "weak"');

const mediumPass = evaluatePasswordStrength('minhasenhaboa');
assert(mediumPass.strength === 'fair', 'Senha com caracteres mas sem variedade deve ser "fair"');

const strongPass = evaluatePasswordStrength('Fluxo#Seguro2026!');
assert(strongPass.strength === 'good', 'Senha longa com letras, números e símbolos deve ser "good"');

// 3. AUTH ERROR NEUTRALITY (ANTI-USER ENUMERATION)
console.log('\n--- Testando Neutralidade de Erros e Proteção contra Enumeração ---');
const invalidCreds = translateAuthError({ message: 'Invalid login credentials' });
assert(
  invalidCreds === 'E-mail ou senha inválidos.',
  'Erro de credenciais inválidas deve ser genérico e neutro'
);

const userNotFound = translateAuthError({ message: 'User not found' });
assert(
  userNotFound === 'Não foi possível concluir a operação. Tente novamente.',
  'Erro "User not found" NÃO deve revelar existência do e-mail'
);

const userAlreadyExists = translateAuthError({ message: 'User already registered' });
assert(
  userAlreadyExists === 'Não foi possível concluir o cadastro com este e-mail.',
  'Cadastro existente não deve expor dados técnicos'
);

const rateLimit = translateAuthError({ message: 'over_email_send_rate_limit' });
assert(
  rateLimit === 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.',
  'Rate limit deve exibir aviso claro de espera'
);

const genericError = translateAuthError(null);
assert(
  genericError === 'Ocorreu um erro inesperado. Tente novamente.',
  'Erro nulo/desconhecido deve retornar mensagem segura padrão'
);

// 4. VERIFICAÇÃO DE RLS E MULTI-TENANCY CONCEITUAL
console.log('\n--- Testando Regras Conceituais de Multi-Tenancy e RLS ---');
const fakeUserA = 'user-uuid-1111';
const fakeUserB = 'user-uuid-2222';

function simulateRLSPolicyCheck(currentAuthUser: string, recordUserId: string) {
  // Simula auth.uid() = user_id do PostgreSQL
  return currentAuthUser === recordUserId;
}

assert(
  simulateRLSPolicyCheck(fakeUserA, fakeUserA) === true,
  'Usuário A tem acesso aos seus próprios registros'
);
assert(
  simulateRLSPolicyCheck(fakeUserA, fakeUserB) === false,
  'Usuário A é terminantemente bloqueado de ler ou alterar registros do Usuário B'
);

// 5. TESTES DE AUTORIZAÇÃO E PAPÉIS (RBAC)
console.log('\n--- Testando Papéis de Autorização (RBAC - app_metadata) ---');
interface MockSessionUser {
  id: string;
  email: string;
  user_metadata?: { role?: string; full_name?: string };
  app_metadata?: { role?: string };
}

function checkAdminAuthorization(user: MockSessionUser): boolean {
  // SEGURANÇA: Autorização NUNCA pode confiar em user_metadata (que o cliente pode editar)
  // Deve confiar EXCLUSIVAMENTE em app_metadata.role
  return user.app_metadata?.role === 'admin';
}

const legitimateAdmin: MockSessionUser = {
  id: 'admin-1',
  email: 'admin@fluxo.app',
  app_metadata: { role: 'admin' },
};

const commonUser: MockSessionUser = {
  id: 'user-2',
  email: 'usuario@fluxo.app',
  app_metadata: { role: 'user' },
};

const attackerUserTampering: MockSessionUser = {
  id: 'attacker-3',
  email: 'hacker@fluxo.app',
  user_metadata: { role: 'admin' }, // Tentativa de forjar admin em user_metadata
  app_metadata: { role: 'user' },
};

assert(
  checkAdminAuthorization(legitimateAdmin) === true,
  'Administrador com app_metadata.role="admin" tem acesso concedido'
);
assert(
  checkAdminAuthorization(commonUser) === false,
  'Usuário comum com app_metadata.role="user" é bloqueado de ações administrativas'
);
assert(
  checkAdminAuthorization(attackerUserTampering) === false,
  'Tentativa de escalonamento via user_metadata.role é bloqueada'
);

// 6. PROTEÇÃO DO ÚLTIMO ADMINISTRADOR E AUTO-BLOQUEIO
console.log('\n--- Testando Proteção do Último Administrador ---');
function canDemoteOrBlockAdmin(
  actorAdminId: string,
  targetUserId: string,
  activeAdminIds: string[]
): { allowed: boolean; reason?: string } {
  if (actorAdminId === targetUserId) {
    return { allowed: false, reason: 'Auto-bloqueio não permitido' };
  }
  if (activeAdminIds.includes(targetUserId) && activeAdminIds.length <= 1) {
    return { allowed: false, reason: 'Não é permitido remover o último administrador ativo' };
  }
  return { allowed: true };
}

assert(
  canDemoteOrBlockAdmin('admin-1', 'admin-1', ['admin-1']).allowed === false,
  'Admin tentando bloquear sua própria conta é bloqueado'
);
assert(
  canDemoteOrBlockAdmin('admin-1', 'admin-2', ['admin-2']).allowed === false,
  'Tentativa de rebaixar/bloquear o único administrador do sistema é bloqueada'
);
assert(
  canDemoteOrBlockAdmin('admin-1', 'admin-2', ['admin-1', 'admin-2']).allowed === true,
  'Com 2 ou mais administradores, alteração é permitida'
);

// 7. PROTEÇÃO DO ADMINISTRADOR MASTER
console.log('\n--- Testando Proteção do Administrador Master (is_master_admin) ---');
interface ManagedUserRecord {
  id: string;
  email: string;
  app_metadata: {
    role: "admin" | "user";
    is_master_admin?: boolean;
  };
}

function canDemoteOrBlockTarget(
  target: ManagedUserRecord,
  newRole?: "admin" | "user",
  isBlockAction?: boolean
): { allowed: boolean; reason?: string } {
  if (target.app_metadata.is_master_admin) {
    if (isBlockAction) {
      return { allowed: false, reason: "Administrador Master não pode ser bloqueado" };
    }
    if (newRole && newRole !== "admin") {
      return { allowed: false, reason: "Administrador Master não pode ser rebaixado" };
    }
  }
  return { allowed: true };
}

const masterAdmin: ManagedUserRecord = {
  id: "master-1",
  email: "jairo@fluxo.app",
  app_metadata: { role: "admin", is_master_admin: true },
};

const standardAdmin: ManagedUserRecord = {
  id: "admin-2",
  email: "auxiliar@fluxo.app",
  app_metadata: { role: "admin", is_master_admin: false },
};

assert(
  canDemoteOrBlockTarget(masterAdmin, 'user').allowed === false,
  'Tentativa de rebaixar Administrador Master é terminantemente bloqueada'
);
assert(
  canDemoteOrBlockTarget(masterAdmin, undefined, true).allowed === false,
  'Tentativa de bloquear Administrador Master é terminantemente bloqueada'
);
assert(
  canDemoteOrBlockTarget(standardAdmin, 'user').allowed === true,
  'Admin comum pode ser alterado se regras do último admin forem satisfeitas'
);

// 8. ISOLAMENTO ENTRE ADMINISTRAÇÃO E DADOS FINANCEIROS PESSOAIS (RLS)
console.log('\n--- Testando Separação entre Permissão Admin e RLS Financeiro ---');
function canAccessFinancialRecord(
  actor: { id: string; app_metadata: { role: string } },
  recordOwnerId: string
): boolean {
  // RLS PRINCÍPIO: Ser Admin NÃO concede bypass automático dos dados financeiros alheios
  // auth.uid() = user_id deve ser respeitado incondicionalmente para tabelas financeiras
  return actor.id === recordOwnerId;
}

const regularUserRecordOwner = "user-regular-999";
assert(
  canAccessFinancialRecord(masterAdmin, regularUserRecordOwner) === false,
  'Admin Master NÃO possui acesso aos lançamentos financeiros privados de outro usuário (RLS preservado)'
);
assert(
  canAccessFinancialRecord(masterAdmin, masterAdmin.id) === true,
  'Admin Master acessa com exclusividade seus próprios dados financeiros'
);

console.log('\n====================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram com sucesso!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
