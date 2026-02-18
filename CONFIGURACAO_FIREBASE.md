# Configuração Firebase - Sincronização entre Dispositivos

Este documento explica as alterações realizadas para garantir que o site continue de onde parou em qualquer dispositivo através da sincronização com Firebase.

## ✅ Alterações Realizadas

### 1. **Integração de Autenticação Firebase**
- O `App.tsx` agora monitora o estado de autenticação do Firebase
- Usuários precisam estar autenticados para acessar e modificar dados
- O estado do usuário é sincronizado automaticamente entre dispositivos

### 2. **Filtro de Dados por Usuário**
- Todas as queries do Firestore agora filtram dados por `userId`
- Cada usuário vê apenas seus próprios dados:
  - Transações (`transactions`)
  - Projetos (`projects`)
  - Funcionários (`employees`)
  - Veículos (`vehicles`)
  - Registros de ponto (`timesheetRecords`)
  - Tarefas agendadas (`scheduleTasks`)

### 3. **Inclusão de userId ao Salvar**
- Todas as operações de criação e atualização incluem automaticamente o `userId`
- Garante que os dados sejam associados ao usuário correto

### 4. **Regras de Segurança do Firestore**
- Criado arquivo `firestore.rules` com regras de segurança
- Usuários só podem acessar seus próprios dados
- Regras aplicadas a todas as coleções principais

### 5. **Configuração do Firebase**
- Arquivo `firebase.json` atualizado para incluir regras do Firestore
- Removido arquivo duplicado de configuração

## 🔧 Configuração Necessária

### 1. Deploy das Regras do Firestore

Execute o comando para fazer deploy das regras:

```bash
firebase deploy --only firestore:rules
```

### 2. Criar Índices Compostos no Firestore

O Firestore requer índices compostos quando você usa `where` + `orderBy` na mesma query. Quando você executar o app pela primeira vez, o Firebase mostrará links para criar esses índices automaticamente. Ou você pode criá-los manualmente:

**No Console do Firebase > Firestore > Indexes**, crie os seguintes índices:

1. **Coleção: transactions**
   - Campos: `userId` (Ascending), `date` (Descending)
   - Query scope: Collection

2. **Coleção: projects**
   - Campos: `userId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

3. **Coleção: employees**
   - Campos: `userId` (Ascending), `name` (Ascending)
   - Query scope: Collection

4. **Coleção: scheduleTasks**
   - Campos: `userId` (Ascending), `date` (Ascending)
   - Query scope: Collection

### 3. Configurar Autenticação no Firebase Console

1. Acesse o [Console do Firebase](https://console.firebase.google.com)
2. Selecione o projeto `prompt-metal`
3. Vá em **Authentication** > **Sign-in method**
4. Ative os métodos de login desejados:
   - **Email/Password** (recomendado)
   - **Google** (opcional)

### 4. Verificar Regras do Firestore

Após fazer deploy das regras, verifique no Console do Firebase:
- **Firestore** > **Rules**
- As regras devem estar ativas e permitindo apenas acesso aos próprios dados do usuário

## 📱 Como Funciona a Sincronização

1. **Login**: Usuário faz login com Firebase Auth (email/senha ou Google)
2. **Identificação**: O sistema identifica o usuário pelo `uid` do Firebase Auth
3. **Carregamento**: Dados são carregados automaticamente do Firestore filtrados por `userId`
4. **Sincronização**: Qualquer alteração é salva no Firestore e sincronizada em tempo real
5. **Multi-dispositivo**: Ao fazer login em outro dispositivo, os mesmos dados são carregados automaticamente

## ⚠️ Importante

### Autenticação Necessária
- **ANTES**: O app funcionava sem autenticação, usando apenas localStorage para role
- **AGORA**: É necessário fazer login com Firebase Auth para acessar os dados
- O componente `RoleSelection` ainda funciona, mas os dados só são carregados após autenticação Firebase

### Migração de Dados Existentes
Se você já tem dados no Firestore sem `userId`, você precisará:

1. Criar um script de migração para adicionar `userId` aos documentos existentes
2. Ou começar com dados novos após a primeira autenticação

### Teste Local
Para testar localmente:

```bash
npm run dev
```

Certifique-se de que:
- As variáveis de ambiente estão configuradas no `.env.local`
- O Firebase está configurado corretamente
- Você fez login com Firebase Auth antes de tentar acessar os dados

## 🔐 Segurança

As regras do Firestore garantem que:
- Apenas usuários autenticados podem ler/escrever dados
- Usuários só podem acessar seus próprios dados (filtrados por `userId`)
- Tentativas de acesso não autorizado são bloqueadas automaticamente

## 📝 Próximos Passos Recomendados

1. **Integrar RoleSelection com Firebase Auth**: Fazer o login Firebase antes de selecionar o role
2. **Salvar role no Firestore**: Associar o role (admin/guest) ao perfil do usuário no Firestore
3. **Migração de dados**: Se houver dados antigos, criar script de migração
4. **Testes**: Testar em múltiplos dispositivos para garantir sincronização

## 🐛 Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verifique se as regras do Firestore foram deployadas corretamente
- Verifique se o usuário está autenticado (`auth.currentUser` não é null)

### Erro: "The query requires an index"
- Acesse o link fornecido no erro para criar o índice automaticamente
- Ou crie manualmente no Console do Firebase

### Dados não aparecem
- Verifique se o usuário está autenticado
- Verifique se os dados têm o campo `userId` correto
- Verifique o console do navegador para erros
