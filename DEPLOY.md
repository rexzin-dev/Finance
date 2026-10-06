# Guia Oficial de Deploy: Fluxo — Gestão Financeira Pessoal
**Arquitetura:** Frontend na Vercel | Banco & Auth no Supabase Cloud (Plano Free)

Este documento contém o passo a passo manual e seguro para publicação do sistema em produção.

---

### PASSO 1 — Criar Supabase
1. Acesse [supabase.com](https://supabase.com) e entre na sua conta.
2. Clique em **"New project"**.
3. Escolha um nome para a organização e o projeto (ex.: `fluxo-finance`).
4. Defina uma senha forte para o banco de dados PostgreSQL.
5. Selecione a região mais próxima do seu público (ex.: `sa-east-1` São Paulo / Brazil).
6. Aguarde 1 a 2 minutos até que o projeto seja provisionado.

---

### PASSO 2 — Obter Project Ref
1. No painel do seu projeto no Supabase, vá em **Project Settings** (ícone de engrenagem no menu lateral).
2. Na aba **General**, copie o **Reference ID** (uma sequência alfanumérica de cerca de 20 caracteres, ex.: `abcdefghijklmnopqrs`).

---

### PASSO 3 — Obter URL
1. No menu lateral, acesse **Project Settings > API**.
2. Na seção **Project URL**, copie a URL da API (ex.: `https://abcdefghijklmnopqrs.supabase.co`).

---

### PASSO 4 — Obter Publishable Key
1. Ainda em **Project Settings > API**, localize a seção **Project API keys**.
2. Copie a chave **anon / public** (ou a nova chave com tag `Publishable`).
3. Esta é a chave segura que será exposta no frontend.

---

### PASSO 5 — Obter Secret Key
1. Na mesma tela de API keys, localize a chave **service_role / secret**.
2. Copie esta chave com atenção.
> **ATENÇÃO:** Esta chave ignora o Row Level Security (RLS) e possui poderes administrativos totais. Ela deve ser utilizada **exclusivamente no servidor** e NUNCA colocada em variáveis com prefixo `NEXT_PUBLIC_`.

---

### PASSO 6 — Linkar CLI
No terminal da sua máquina (dentro da pasta do projeto `Finance`), execute:
```bash
# 1. Faça login na sua conta do Supabase
npx supabase login

# 2. Conecte o repositório local ao seu projeto do Supabase Cloud
npx supabase link --project-ref SEU_PROJECT_REF
```
*(Substitua `SEU_PROJECT_REF` pelo Reference ID obtido no Passo 2).*

---

### PASSO 7 — Aplicar Migrations
Envie todo o schema consolidado, tabelas, índices, triggers e políticas RLS para o banco remoto com um único comando:
```bash
npx supabase db push
```
O Supabase aplicará o arquivo consolidado `supabase/migrations/001_initial_schema.sql` criando todas as 17 tabelas, enums, triggers de profile automático e regras de isolamento RLS.

---

### PASSO 8 — Criar Primeiro Usuário
1. Inicie a aplicação localmente (`npm run dev`) ou utilize a tela de registro de produção.
2. Acesse a rota `/register` (ex.: `http://localhost:4000/register`).
3. Cadastre sua conta informando seu Nome, E-mail e Senha.
4. Caso a confirmação de e-mail esteja ativada, confirme o e-mail recebido.

---

### PASSO 9 — Promover Primeiro Admin
Para transformar o seu usuário recém-criado no Administrador do sistema sem depender de comandos complexos de SQL, configure temporariamente as variáveis no seu `.env.local` e execute o script de bootstrap:
```bash
npm run set-admin -- seu-email@dominio.com
```
O script atualizará de forma segura o `app_metadata.role` do usuário para `"admin"` utilizando a Supabase Admin API.

---

### PASSO 10 — Configurar Vercel
1. Acesse [vercel.com](https://vercel.com) e importe o repositório Git do projeto.
2. Em **Project Settings > Environment Variables**, cadastre as seguintes variáveis (para os ambientes *Production*, *Preview* e *Development*):

| Variável | Valor | Tipo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sua Project URL obtida no Passo 3 | Pública |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sua Anon/Publishable Key obtida no Passo 4 | Pública |
| `NEXT_PUBLIC_SITE_URL` | A URL da sua aplicação (ex.: `https://fluxo.vercel.app`) | Pública |
| `SUPABASE_SECRET_KEY` | Sua Service Role Key obtida no Passo 5 | **Privada (Secret)** |

---

### PASSO 11 — Configurar Site URL no Supabase
1. No painel do Supabase, vá em **Authentication > URL Configuration**.
2. No campo **Site URL**, preencha com a URL oficial de produção da Vercel:
   ```
   https://seu-projeto.vercel.app
   ```

---

### PASSO 12 — Configurar Redirect URLs no Supabase
Abaixo do Site URL, na seção **Redirect URLs**, clique em **Add URI** e adicione as seguintes origens permitidas:
- `http://localhost:3000/**`
- `http://localhost:4000/**`
- `https://seu-projeto.vercel.app/**`
- `https://*-seu-time.vercel.app/**` *(para branches de preview na Vercel)*

Isso garante que links de confirmação de e-mail, convites de novos usuários e redefinição de senha redirecionem com sucesso para as rotas corretas (`/reset-password`).

---

### PASSO 13 — Deploy
1. No painel da Vercel, clique em **Deploy** (ou faça um `git push` na branch `main`).
2. A Vercel executará o build de produção automaticamente (`npm run build`).

---

### PASSO 14 — Validar Produção
1. Abra a URL pública do sistema (ex.: `https://seu-projeto.vercel.app/login`).
2. Efetue login com suas credenciais de Administrador.
3. Acesse **Configurações > Usuários e Acessos** para validar o painel administrativo.
4. Crie uma conta ou convide um novo usuário para testar o isolamento completo de dados (RLS).
