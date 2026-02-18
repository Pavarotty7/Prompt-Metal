# Firebase Setup Guide - PromptMetal

Este guia documenta como o app está configurado para usar Firebase (Firestore, Auth e Storage).

## Configuração Inicial

### 1. Variáveis de Ambiente

Crie ou atualize o arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Firebase:

```bash
VITE_FIREBASE_API_KEY=AIzaSyCAyFLJztZB8UcUdh4yXf-h49IZAFBy5nI
VITE_FIREBASE_AUTH_DOMAIN=prompt-metal.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prompt-metal
VITE_FIREBASE_STORAGE_BUCKET=prompt-metal.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=307567224548
VITE_FIREBASE_APP_ID=1:307567224548:web:92b65cfb9bd4e82071eef1
```

As variáveis são lidas em `services/firebase.ts` via `import.meta.env.VITE_*` (padrão Vite).

### 2. Regras do Firestore

Aplique as seguintes regras no Console do Firebase > Firestore > Rules:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permite acesso de leitura e escrita a qualquer usuário logado
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Regras do Storage

Aplique as seguintes regras no Console do Firebase > Storage > Rules:

```
service firebase.storage {
  match /b/{bucket}/o {
    // Permite que qualquer usuário logado faça upload, leia e delete
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Autenticação

No Console do Firebase > Authentication:
- Ative **Email/Password** em "Sign-in method"
- Opcionalmente, ative **Google** para login social

## Funcionalidades Implementadas

### View Firebase (`/firebase`)

A view `firebase` está disponível no menu lateral e oferece três demos:

#### 1. **AuthView** (`components/AuthView.tsx`)
- Login/Signup com email e senha
- Login com Google
- Status de autenticação em tempo real
- Botão de logout

#### 2. **FirestoreDemo** (`components/FirestoreDemo.tsx`)
- Leitura e escrita na coleção `messages`
- Requer autenticação
- Mostra mensagens com timestamp e UID do autor
- Trata erros de permissão automaticamente

#### 3. **StorageDemo** (`components/StorageDemo.tsx`)
- Upload de arquivos para Storage
- Requer autenticação
- Gera URL de download público
- Exibe progresso de upload

## Como Usar

### Desenvolvimento

```bash
npm run dev
# Acesse http://localhost:3000
```

### Build de Produção

```bash
npm run build
# Saída em `dist/`
```

### Preview

```bash
npm run preview
```

## Fluxo de Autenticação

1. Usuario seleciona role (Admin/Guest) na tela de `RoleSelection`
2. Se faz login via Firebase na view `firebase`, o `userRole` é sincronizado automaticamente para `admin`
3. Logout desconecta tanto do app local quanto do Firebase
4. Estado persiste em `localStorage` com chave `promptmetal_role`

## Testando Firestore

1. Acesse o app via dev server
2. Navegue até a view `Firebase` no menu lateral
3. Faça login com email/senha ou Google
4. Em **Firestore**, tente enviar uma mensagem
5. Verifique no Console do Firebase > Firestore > `messages` que a mensagem foi criada

## Testando Storage

1. Após fazer login
2. Em **Storage**, selecione um arquivo
3. Clique "Upload"
4. Copie a URL gerada e abra em uma aba nova para confirmar o upload

## Estrutura de Arquivos Importantes

```
services/firebase.ts       # Inicialização do Firebase
components/AuthView.tsx    # UI de autenticação
components/FirestoreDemo.tsx # Demo de Firestore
components/StorageDemo.tsx  # Demo de Storage
.env.local                 # Variáveis de ambiente
```

## Notas de Segurança

- **Nunca commite `.env.local`** em repositórios públicos
- As credenciais da API pública do Firebase são seguras (chave de restrição aplicada no console)
- As regras de Firestore/Storage protegem os dados (autenticação obrigatória)
- Para produção, configure restrições adicionais por UID ou email conforme necessário

## Próximos Passos

1. Integrar dados do app principal (Projects, Transactions, etc.) com Firestore
2. Implementar sincronização em tempo real com `onSnapshot()`
3. Adicionar validação de dados no lado do cliente
4. Criar índices no Firestore para queries mais complexas
5. Configurar triggers do Cloud Functions para automações

