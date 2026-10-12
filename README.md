# 💰 FinWise - Gestor Financeiro Pessoal

Um aplicativo completo e moderno para controle financeiro pessoal, rastreamento de despesas e receitas, metas por categoria, leitor de código de barras para boletos, lembretes de contas recorrentes, backup com Google Drive e dicas inteligentes de economia.

---

## 🚀 Como rodar o projeto localmente no seu computador (via GitHub)

Se você já tem o código ou clonou este repositório do GitHub:

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior): [Baixar Node.js](https://nodejs.org/)
- **Git** instalado no seu computador

### 2. Clonar o repositório
Abra o seu terminal (Prompt de Comando, PowerShell ou Terminal do Mac/Linux) e execute:
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
```

### 3. Instalar as dependências
```bash
npm install
```

### 4. Configurar as variáveis de ambiente (Opcional)
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
*(O aplicativo funciona normalmente mesmo sem chave de API, pois possui um motor de regras financeiras local para dicas).*

### 5. Iniciar a aplicação
```bash
npm run dev
```

Pronto! Abra seu navegador e acesse:
👉 **`http://localhost:3000`**

---

## 🌐 Como hospedar o app online direto pelo GitHub (Grátis, 24/7)

Se você quer que o aplicativo fique acessível na internet sem precisar abrir o Google AI Studio:

### Opção A: Vercel (Mais rápida e recomendada)
1. Crie uma conta gratuita em [vercel.com](https://vercel.com).
2. Conecte sua conta do **GitHub**.
3. Clique em **"Add New Project"** e selecione o repositório do FinWise.
4. O Vercel detectará automaticamente o Vite/React.
5. Clique em **"Deploy"**. Em menos de 1 minuto você terá um link público (ex: `https://finwise-seu-nome.vercel.app`).

### Opção B: Render.com (Para rodar com o servidor Node/Express)
1. Crie uma conta gratuita em [render.com](https://render.com).
2. Clique em **"New +"** -> **"Web Service"**.
3. Conecte seu repositório do GitHub.
4. Configure os comandos:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start` (ou `npm run dev`)
5. Clique em **"Deploy Web Service"**.

---

## 📦 Scripts Disponíveis no Projeto

- `npm run dev`: Inicia o servidor local de desenvolvimento na porta 3000 (`tsx server.ts`).
- `npm run build`: Compila a aplicação para produção na pasta `dist/`.
- `npm run preview`: Pré-visualiza os arquivos estáticos de produção.
- `npm run lint`: Checagem de tipagem com TypeScript.

---

## 🛠️ Tecnologias Utilizadas
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **Express** (Node.js)
- **Lucide Icons**
- **Recharts** (Gráficos financeiros)
- **HTML5-QRCode** (Leitor de código de barras para boletos)
- **jsPDF & html2canvas** (Exportação de relatórios em PDF)
