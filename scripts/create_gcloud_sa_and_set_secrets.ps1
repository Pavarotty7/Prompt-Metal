param(
  [string]$ProjectId = 'prompt-metal',
  [string]$ServiceAccountName = 'github-action-1160161803',
  [string]$GitHubRepo = 'Pavarotty7/Prompt-Metal'
)

Write-Host "Verificando dependências: gcloud, gh..."
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Error "gcloud não encontrado. Instale o Google Cloud SDK e autentique: gcloud auth login"; exit 1
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh (GitHub CLI) não encontrado. Instale o GitHub CLI e autentique: gh auth login"; exit 1
}

Write-Host "Configurando projeto GCP: $ProjectId"
gcloud config set project $ProjectId

Write-Host "Criando service account: $ServiceAccountName"
gcloud iam service-accounts create $ServiceAccountName --display-name="GitHub Action (Firebase Deploy)" --project=$ProjectId

$saEmail = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"

Write-Host "Atribuindo roles necessárias ao service account..."
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$saEmail" --role="roles/firebasehosting.admin"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$saEmail" --role="roles/iam.serviceAccountUser"

Write-Host "(Opcional) Adicionando role para gerenciar chaves de service account"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$saEmail" --role="roles/iam.serviceAccountKeyAdmin"

Write-Host "Gerando chave JSON localmente..."
$keyPath = Join-Path -Path $PWD -ChildPath "${ServiceAccountName}-key.json"
gcloud iam service-accounts keys create $keyPath --iam-account=$saEmail --project=$ProjectId

if (-not (Test-Path $keyPath)) { Write-Error "Falha ao criar a chave JSON"; exit 1 }

Write-Host "Adicionando secret FIREBASE_SERVICE_ACCOUNT no repositório GitHub $GitHubRepo"
$keyContent = Get-Content -Raw -Path $keyPath
gh secret set FIREBASE_SERVICE_ACCOUNT --repo $GitHubRepo --body "$keyContent"

Write-Host "Adicionando variáveis VITE_FIREBASE_* como secrets (opcional)"
Write-Host "Digite VITE_FIREBASE_API_KEY (ou ENTER para pular):"
$fbApiKey = Read-Host
if ($fbApiKey) { gh secret set VITE_FIREBASE_API_KEY --repo $GitHubRepo --body $fbApiKey }

Write-Host "Adicionando Supabase secrets (opcional)"
Write-Host "Digite VITE_SUPABASE_URL (ou ENTER para pular):"
$sUrl = Read-Host
if ($sUrl) { gh secret set VITE_SUPABASE_URL --repo $GitHubRepo --body $sUrl }
Write-Host "Digite VITE_SUPABASE_ANON_KEY (ou ENTER para pular):"
$sKey = Read-Host
if ($sKey) { gh secret set VITE_SUPABASE_ANON_KEY --repo $GitHubRepo --body $sKey }

Write-Host "Limpeza: não removi o arquivo de chave por segurança; remova manualmente quando desejar: $keyPath"
Write-Host "Concluído. Agora vá ao GitHub Actions e rode o workflow 'Build and Deploy to Firebase Hosting'."
