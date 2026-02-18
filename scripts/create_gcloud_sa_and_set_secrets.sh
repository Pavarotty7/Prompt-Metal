#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create_gcloud_sa_and_set_secrets.sh [PROJECT_ID] [SERVICE_ACCOUNT_NAME] [GITHUB_REPO]
# Example: ./scripts/create_gcloud_sa_and_set_secrets.sh prompt-metal github-action-1160161803 Pavarotty7/Prompt-Metal

PROJECT_ID=${1:-prompt-metal}
SERVICE_ACCOUNT_NAME=${2:-github-action-1160161803}
GITHUB_REPO=${3:-Pavarotty7/Prompt-Metal}

echo "Verificando dependências: gcloud, gh..."
if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud não encontrado. Instale o Google Cloud SDK e autentique: gcloud auth login" >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh (GitHub CLI) não encontrado. Instale o GitHub CLI e autentique: gh auth login" >&2
  exit 1
fi

echo "Configurando projeto GCP: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "Criando service account: $SERVICE_ACCOUNT_NAME"
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" --display-name="GitHub Action (Firebase Deploy)" --project="$PROJECT_ID"

SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Atribuindo roles ao service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="roles/firebasehosting.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountKeyAdmin"

KEY_PATH="${PWD}/${SERVICE_ACCOUNT_NAME}-key.json"
echo "Gerando chave JSON em: $KEY_PATH"
gcloud iam service-accounts keys create "$KEY_PATH" --iam-account="$SA_EMAIL" --project="$PROJECT_ID"

if [[ ! -f "$KEY_PATH" ]]; then
  echo "ERROR: Falha ao gerar a chave JSON" >&2
  exit 1
fi

echo "Enviando secret FIREBASE_SERVICE_ACCOUNT para o repositório GitHub: $GITHUB_REPO"
gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$GITHUB_REPO" --body "$(cat "$KEY_PATH")"

read -rp "Deseja adicionar VITE_FIREBASE_API_KEY como secret? (enter para pular) " FB_API_KEY
if [[ -n "$FB_API_KEY" ]]; then
  gh secret set VITE_FIREBASE_API_KEY --repo "$GITHUB_REPO" --body "$FB_API_KEY"
fi

read -rp "Deseja adicionar VITE_SUPABASE_URL como secret? (enter para pular) " SUPA_URL
if [[ -n "$SUPA_URL" ]]; then
  gh secret set VITE_SUPABASE_URL --repo "$GITHUB_REPO" --body "$SUPA_URL"
fi

read -rp "Deseja adicionar VITE_SUPABASE_ANON_KEY como secret? (enter para pular) " SUPA_KEY
if [[ -n "$SUPA_KEY" ]]; then
  gh secret set VITE_SUPABASE_ANON_KEY --repo "$GITHUB_REPO" --body "$SUPA_KEY"
fi

echo "Observação: o arquivo de chave JSON foi gerado em $KEY_PATH. Remova-o manualmente quando não for mais necessário." 
echo "Concluído. Verifique o repositório GitHub para confirmar que os secrets foram adicionados.
Depois, confirme que o workflow '.github/workflows/firebase-hosting-deploy.yml' está no branch main para acionar o deploy." 

exit 0
