# PromptMetal

Aplicação React + Express com integração Google Drive (OAuth2) para backup/sincronização.

## Pré-requisitos

- Node.js 20+
- Conta Google Cloud com OAuth 2.0 Client ID
- (Opcional) Firebase CLI para deploy estático do frontend

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
GEMINI_API_KEY=seu_gemini_api_key
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
APP_URL=http://localhost:3000
PORT=3000
```

## Configurar OAuth do Google Drive

No Google Cloud Console:

1. Ative a API **Google Drive API**.
2. Vá em **APIs e Serviços > Credenciais > Criar credenciais > ID do cliente OAuth**.
3. Tipo: **Aplicativo Web**.
4. Adicione os URIs autorizados:
   - Origem JavaScript (local): `http://localhost:3000`
   - Redirect URI (local): `http://localhost:3000/auth/google/callback`
   - Em produção, adicione também:
     - Origem: `https://SEU_DOMINIO`
     - Redirect: `https://SEU_DOMINIO/auth/google/callback`
5. Copie `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para o `.env` (e para as variáveis do provider de deploy).

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Build e verificação

```bash
npm run lint
npm run build
```

## Deploy (aplicação completa com Google Drive)

Para o Google Drive funcionar, o backend Express precisa estar ativo em produção (rotas `/api/*` e callback OAuth).

### Deploy recomendado (Node full-stack: Render/Railway/Fly.io)

- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Variáveis de ambiente no provedor:
  - `NODE_ENV=production`
  - `GEMINI_API_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `APP_URL=https://SEU_DOMINIO_PUBLICO`
  - `PORT` (se necessário)

Depois do deploy, confirme no Google Cloud Console que o `APP_URL` está cadastrado como origem e redirect URI.

## Deploy Firebase (Hosting + Functions)

Para o Google Drive funcionar no domínio `web.app`, publique frontend e backend juntos:

1. Instale dependências do projeto e das functions:

```bash
npm install
cd functions && npm install && cd ..
```

2. Configure variáveis das Functions (arquivo `functions/.env`):

```env
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
APP_URL=https://SEU_PROJETO.web.app
NODE_ENV=production
```

3. Gere a build e faça deploy:

```bash
npm run build
firebase deploy --only hosting,functions
```

4. No Google Cloud Console, inclua exatamente:
  - Origem: `https://SEU_PROJETO.web.app`
  - Redirect URI: `https://SEU_PROJETO.web.app/auth/google/callback`
