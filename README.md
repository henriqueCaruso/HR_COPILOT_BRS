# 🤖 RHIÁ - HR Copilot UniFECAF

![RHIÁ Agent Architecture](https://img.shields.io/badge/Status-Active-success) ![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Firebase-blue) ![AI Model](https://img.shields.io/badge/Model-Gemini%203.1%20Pro-orange)

Bem-vindo ao repositório oficial da **RHIÁ**, o seu Copiloto de Inteligência Artificial desenhado especificamente para o setor de Recursos Humanos e Comunicação Interna. 

Este projeto é resultado e entrega oficial do desafio acadêmico da **UniFECAF** para a disciplina de *Fundamentos da IA Generativa*.

---

## 📌 1. O Desafio e Contextualização
De acordo com o desafio proposto, equipes de RH e Comunicação Interna frequentemente se encontram sobrecarregadas com demandas repetitivas do dia a dia: redigir e-mails padrão, criar comunicados oficiais, resumir reuniões pautas e formular mensagens com a cultura da empresa para o WhatsApp. 

O grande problema é o **tempo operacional** gasto em tarefas puramente redatoriais que não exigem necessariamente um esforço estratégico, mas que exigem precisão, coesão, e a adoção estrita do "tom de voz" organizacional. 

## 💡 2. A Solução: Conheça a RHIÁ (Nossa Aplicação)
Em vez de utilizar uma solução genérica (como criar uma automação simples via Make/Zapier), fomos além e desenvolvemos uma **aplicação web completa e dedicada**, alimentada pelos mais modernos modelos fundacionais de linguagem (LLMs). 

A **RHIÁ** atua como uma assistente inteligente na qual o colaborador interage de modo rápido através de uma interface acadêmica, *clean* e em português (PT-BR). Com um único clique, o usuário determina o meio (Email, WhatsApp, Manual), e através de breves tópicos, a IA gera o texto corporativo pronto, perfeitamente alinhado à cultura da organização.

O grande diferencial é podermos fazer upload de PDFs e regras organizacionais (RAG - *Retrieval-Augmented Generation*) dividindo-os em "Pastas Virtuais", ancorando as respostas da inteligência artificial puramente nos documentos enviados pela empresa (Templates, Manuais e Políticas).

---

## 🚀 3. Stack Tecnológica (A Estrutura do Projeto)

O projeto usa a arquitetura *SPA (Single Page Application)* e os melhores e mais rápidos frameworks de mercado:

* **Frontend:**
  * **[React 19](https://react.dev/):** Biblioteca reativa para montagem da UI.
  * **[Vite 6](https://vitejs.dev/):** *Bundler* de altíssima velocidade.
  * **[Tailwind CSS 4](https://tailwindcss.com/) & [Framer Motion](https://motion.dev/):** Para criação de uma interface limpa, responsiva, acadêmica e fluída (animações polidas de micro-interactions).
* **Backend Backend-as-a-Service:**
  * **[Firebase](https://firebase.google.com/):** Fornece persistência com o *Firestore Database* (histórico de chat, logs e metadados) e *Firebase Auth* para segurança via login do Google.
* **Inteligência Artificial (Cérebro):**
  * **[Google Gemini API (`@google/genai`)](https://ai.google.dev/):** API moderna conectada aos modelos `gemini-3.1-pro-preview`, `gemini-3-flash` e `flash-lite`. Integrada diretamente para geração contextual de texto, *Thinking feature* (pensamento profundo), e *File API* (armazenamento e vetorização de documentos do RAG).

---

## 🧠 4. Engenharia de Prompt (System Prompt & Input Setup)

O projeto ganha vida por conta do poder do *System Prompt* elaborado. 

### A. Modificação Contínua do *System Prompt*
Configuramos a API da IA injetando no sistema central as seguintes características inegociáveis:
1. **Identidade Estrita:** "Você é a RHIÁ, uma assistente do setor de RH da UniFECAF". Isso amarra a identidade para garantir que as respostas carreguem o tom profissional e acadêmico da instituição.
2. **Contextualização com Documentos (*RAG*):** O *System Prompt* é embutido dinamicamente com os conteúdos de pastas virtuais previamente definidas por usuários em categorias restritas (Documentos de RH, Modelos Institucionais). Se o usuário pergunta como fazer um processo seletivo, a IA vasculha o documento que tem `tag: Políticas`.
3. **Formatação de Saída Exata:** Adicionamos amarras absolutas indicando *"You MUST always return generated texts wrapped inside formatted markdown code blocks for easy copying"*. 

### B. Como o Prompt Prático do Usuário é Estruturado
Na nossa interface, o usuário não precisa "saber conversar" com a IA. Ele clica em um botão, por exemplo, "Mensagem de WhatsApp", e preenche com os tópicos ("1. Feriado semana que vem; 2. Expediente até as 14h"). 

O *workflow* pega essas informações pelo *Under-the-hood* e estrutura programaticamente o prompt antes de enviar à API:
> *"Aja como RHIÁ. Crie uma comunicação no formato de [WHATSAPP], com tom de voz [INSTITUCIONAL e ACOLHEDOR], baseada EXCLUSIVAMENTE nos seguintes tópicos: [1. Feriado semana que vem; 2. Expediente até as 14h]. Se apoie nos manuais contextuais se necessário."*

---

## 🛠 5. Tutorial: Como Implantamos os Requisitos no Código

Para criar este projeto não utilizamos programação manual arcaica do zero de uma tacada só, mas adotamos processos ágeis com ajuda de nossa própria *IA Tooling* para arquitetar a solução:

1. **Configuração da Base Frontend:** Estabelecemos o React + Vite. Limpamos os boilerplate criados e montamos a base de estilo com Tailwind CSS para garantir responsividade no mobile da empresa.
2. **Autenticação:** O RH possui dados sensíveis, portanto integramos no `AuthContext.tsx` o pacote raiz do *Firebase 12*. Qualquer pessoa sem um login válido é bloqueada pela barreira lógica (HOC).
3. **Integração com Gemini AI API:** Criamos um arquivo isolado em `src/lib/gemini.ts`. Nele instanciamos nosso construtor `new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY })`.
4. **Gerenciador de RAG e Sistema de Arquivos (Virtual Folders):** 
   - Foi injetado o componente de `DocumentUpload.tsx`. O administrador da solução arrasta arquivos suportados (PDF, TXT, MD, CSV, etc.), e nossa aplicação realiza o upload direto utilizando o **File Search através do Google Gen AI SDK (`@google/genai`)**. 
   - Construímos uma **integração nativa com o Firebase**, mapeando um banco de dados *Firestore* invisível (Virtual Folders) que vincula os Metadados do File API da IA com a sessão segura de cada usuário no servidor. Isso guia o agente a ler e buscar referências documentais apenas autorizadas ao RH.
5. **Selector Dinâmico:** Para controle de custos pela empresa, instalamos um *Dropdown* de UI, permitindo o chaveamento de LLM ao clique: de um modelo pesadíssimo (`gemini-3.1-pro-preview`) para relatórios longos, até um levíssimo (`gemini-3-flash-lite`) apenas para respostas curtas de WhatsApp.

---

## 🛡 6. Limites Éticos, Segurança e LGPD

Todo projeto envolvendo inteligência artificial no núcleo da corporação precisa respeitar a proteção de dados (Lei 13.709/18). Discutimos pontos relevantes para a RHIÁ:

* **Isolamento de PII (Personally Identifiable Information):** Recomendável informar e treinar o RH para *não* fornecer, sob nenhuma hipótese, CPFs, RGs ou laudos médicos de colaboradores diretamente nos prompts. A IA atua em formatações estruturais.
* **Segregação do Armazenamento:** Os textos gerados ficam armazenados pontualmente no log do usuário via banco de dados protegido do Firebase (*Firestore.rules* configuradas rigorosamente onde *apenas o dono autenticado consegue ver sua sessão*).
* **Treinamento Exclusivo e Viés:** A versão da GenAI Enterprise API não utilizará (não treinará) seus modelos basilares públicos utilizando nossos uploads privados. Mitigamos enviesamento algorítmico mantendo um rastreio das respostas por estarmos utilizando um Modelo Base pré-testado e bem classificado no ranking mundial de segurança cibernética e inibição de conteúdo abusivo.
* **Controle Humano (HITL):** A IA atua na aba geracional. Fica estabelecida a premissa de *Human-in-The-Loop*: o Analista/Especialista de RH SEMPRE será o validador definitivo daquilo que está copiando e colando nos canais de disparo corporativos oficiais da empresa.

---

## 💻 7. Como Baixar e Replicar (Rodando na sua Máquina)

Gostou do projeto e quer colocá-lo para rodar no seu computador? Siga exatamente os passos abaixo. Não é necessária configuração hipercomplexa, apenas ter o [Node.js](https://nodejs.org/en) instalado nas versões recentes (>= 18).

**Passo 1: Clone o Repositório**
```bash
git clone https://github.com/SeuUsuario/HR_COPILOT_UNIFECAF.git
cd HR_COPILOT_UNIFECAF
```

**Passo 2: Instale as Dependências**
```bash
npm install
```

**Passo 3: Configure as Variáveis de Ambiente (.env)**
Na raiz do seu projeto, copie o arquivo de exemplo (`.env.example`) para criar seu arquivo de variáveis protegido:
```bash
cp .env.example .env
```
Preencha a API da sua plataforma [Google AI Studio](https://aistudio.google.com/):
```env
VITE_GEMINI_API_KEY=sua_chave_secreta_aqui
```

**Passo 4: Firebase Config (Se não estivesse fornecido)**
Gere ou baixe no console do Firebase o seu `firebase-applet-config.json` e as chaves nativas de conexão. *(Neste repositório as keys de configuração base do client já podem estar anexadas conforme seu setup)*.

**Passo 5: Execute o Servidor de Desenvolvimento**
```bash
npm run dev
```

Pronto! Acesse em seu navegador via `http://localhost:3000`. O seu ajudante de RH (RHIÁ) estará preparado para rodar e revolucionar a comunicação da sua equipe.

---
*Trabalho acadêmico projetado para o módulo de Fundamentos da IA com foco em IA Generativa - UniFECAF.*
