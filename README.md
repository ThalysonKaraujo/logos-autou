# Logos — Central de Resposta a Incidentes Rodoviários

Plataforma de alta disponibilidade para monitoramento, triagem e resposta a incidentes críticos em frotas rodoviárias de grande porte em tempo real.

---

## 🚀 Acesso Rápido aos Ambientes em Nuvem

| Serviço | Plataforma | Link Direto | Status |
| :--- | :--- | :--- | :---: |
| **Cockpit Operacional (Frontend)** | Vercel | [logos-autou.vercel.app](https://logos-autou.vercel.app) | ![Vercel](https://img.shields.io/badge/Vercel-Online-brightgreen?logo=vercel) |
| **API RESTful (Backend)** | Render | [logos-autou.onrender.com](https://logos-autou.onrender.com) | ![Render](https://img.shields.io/badge/Render-Online-brightgreen?logo=render) |
| **Documentação Interativa (Swagger)** | Render | [/docs](https://logos-autou.onrender.com/docs) | ![OpenAPI](https://img.shields.io/badge/OpenAPI-v3.1-blue) |
| **Documentação Técnica (ReDoc)** | Render | [/redoc](https://logos-autou.onrender.com/redoc) | ![ReDoc](https://img.shields.io/badge/ReDoc-Docs-blue) |

---

## 1. Visão Geral & Contexto Operacional

Em operações de transporte com milhares de veículos em rota, a comunicação descentralizada via aplicativos de mensagens instantâneas e planilhas paralelas gera pontos cegos graves: demora no reconhecimento de sinistros, falta de histórico confiável e decisões descoordenadas.

O **Logos** atua como a camada central de inteligência da operação, transformando o fluxo desordenado de eventos de campo em uma fila estruturada e acionável. A plataforma foi projetada para que analistas em centros de controle operacional (CCO) consigam identificar, priorizar e despachar ocorrências em milissegundos, garantindo rastreabilidade total do ciclo de vida de cada chamado.

---

## 2. Arquitetura do Sistema

A solução adota uma divisão arquitetural estrita entre frontend e backend, orientada a baixo acoplamento, previsibilidade de estado e facilidade de manutenção.

### Backend: Clean Architecture em Camadas

O backend em **Python 3.12 (FastAPI)** estrutura suas responsabilidades sem misturar transporte HTTP, regras de negócio e acesso ao banco:

- **`app/schemas/`**: Contratos de entrada e saída validados estritamente com **Pydantic v2**, incluindo enums semânticos para criticidade (*Alta*, *Média*, *Baixa*), categorias operacionais (*Acidente com Veículo*, *Acidente com Vítimas*, *Condição Climática Atípica na Pista*, *Problema Mecânico*, *Bloqueio de Pista*) e status.
- **`app/api/v1/`**: Camada fina de transporte HTTP, injeção de dependências e mapeamento de códigos de status.
- **`app/core/`**: Middlewares de observabilidade e segurança: injeção de `X-Request-ID` para rastreabilidade fim a fim, medição de latência em `X-Process-Time` e controle de vazão com **Rate Limiting em janela deslizante** (IETF `X-RateLimit-*` e `Retry-After`).
- **`app/services/`**: Domínio central da aplicação. Gerencia validações de transição de ciclo de vida, montagem da trilha de auditoria e orquestração de controle de versão.
- **`app/repositories/`**: Isolamento de persistência através de **SQLAlchemy 2.0 assíncrono**. Consultas de listagem aplicam ordenação indexada por criticidade ponderada (`CASE`) e paginação no banco de dados.

### Frontend: Feature-Sliced Design (FSD v2.1)

O frontend em **React 18 + TypeScript (Vite)** é organizado segundo a metodologia Feature-Sliced Design v2.1, evitando o problema clássico de componentes gigantes misturando regras de negócio e marcação visual:

- **`app/`**: Inicialização da aplicação, provedores globais (React Query, Tema, Sessão do Operador) e montagem de rotas.
- **`pages/`**: Telas completas da aplicação (`pages/cockpit`), orquestrando as features do cockpit operacional.
- **`widgets/`**: Blocos de interface compostos e autônomos, como a barra superior de monitoramento (`widgets/topbar`).
- **`features/`**: Interações que agregam valor de negócio direto (`features/triage-filters`, `features/create-incident`, `features/edit-incident`, `features/operator-session`, `features/theme`).
- **`entities/`**: Modelos de domínio reutilizáveis (`entities/incident`), incluindo tipos, consultas TanStack Query e componentes atômicos como cartões de incidente e painel de detalhes.
- **`shared/`**: Utilitários de domínio agnóstico, cliente HTTP (`api/client.ts`), formatadores de data e biblioteca de componentes base.

---

## 3. Integridade de Dados & Controle de Concorrência

Em uma central onde dezenas de operadores atuam simultaneamente, o risco mais crítico é a sobreposição de ações: o Analista A e o Analista B abrem a mesma ocorrência ao mesmo tempo, e a decisão de um sobrescreve silenciosamente a do outro (*lost update problem*).

### Decisão Técnica: Optimistic Concurrency Control (OCC) vs. Pessimistic Locking

| Abordagem | Vantagens | Desvantagens no Contexto do CCO | Decisão |
| :--- | :--- | :--- | :---: |
| **Lock Pessimista** (`SELECT FOR UPDATE` / Redis Lock) | Impede qualquer escrita concorrente travando o registro. | Trava a leitura e triagem de outros operadores; se a conexão de um analista cair ou a aba for fechada, gera **locks órfãos** ou deadlocks operacionais. | ❌ Descartado |
| **Controle de Concorrência Otimista (OCC)** | Throughput de leitura máximo sem bloqueios; não sofre com quedas de conexão; atômico e determinístico. | Requer tratamento explícito de colisão no cliente. | ✅ **Adotado** |

### Como o OCC Funciona no Logos:

1. **Versionamento Atômico & ETag**: Cada registro de incidente possui um campo inteiro `version` (iniciando em 1), exposto nas respostas via header HTTP padrão `ETag: "<version>"`.
2. **Checagem no Commit com `If-Match`**: Ao despachar uma alteração de status ou edição, o cliente transmite a versão esperada via header padrão `If-Match: "<version>"` (ou campo `expected_version` no corpo):
   ```sql
   UPDATE incidents
   SET status = :new_status,
       version = version + 1,
       updated_at = NOW()
   WHERE id = :incident_id AND version = :expected_version;
   ```
3. **Detecção de Colisão Sem Bloqueio**: Se outro analista atualizou o incidente uma fração de segundo antes, a `version` no banco já terá mudado. O `UPDATE` atômico afeta 0 linhas.
4. **Resposta Padronizada com Estado Atual (HTTP 409)**: A API aborta a transação e responde com `HTTP 409 Conflict`, acompanhada do `X-Request-ID` e dos dados atuais do recurso no banco (`server_state`).
5. **Resolução Visual no Cliente (Diff Modal)**: O frontend intercepta o 409 e abre o `ConflictModal`, apresentando um comparativo campo a campo (diff) entre a tentativa do operador e o que foi gravado pelo colega no servidor, além de permitir copiar as justificativas digitadas para a área de transferência com um clique antes de recarregar os dados.

### Trilha de Auditoria Imutável (*Audit Trail*)

Toda alteração de estado no Logos gera um registro imutável em `incident_history`:
- Status de origem e status de destino (`from_status` → `to_status`);
- Identificação do operador responsável pela ação (`analyst_name`);
- Notas operacionais e justificativas de despacho;
- Carimbo temporal UTC com precisão de microssegundos.

---

## 4. Resiliência de Rede & Performance em Escala

Em centros operacionais e terminais logísticos, a conectividade pode oscilar severamente. O Logos foi desenhado para tolerar falhas de rede e latências elevadas sem perda de dados e sem travar a interface.

### Estratégia de Tolerância a Falhas e Quedas de Rede

- **Persistência em Cache em Memória**: Com `staleTime: 5000` no TanStack Query, a tela nunca "apaga" ou quebra se a rede oscilar enquanto o analista lê uma ocorrência. Os dados permanecem visíveis e navegáveis.
- **Retentativas Automáticas (`retry: 1`)**: Micro-instabilidades de conexão são absorvidas automaticamente com uma nova tentativa imediata antes de apresentar qualquer erro ao usuário.
- **Reconexão Automática sem F5**: O cliente escuta ativamente os eventos nativos `online`/`offline` do navegador e o retorno de foco à janela (`refetchOnWindowFocus: true`). Assim que a internet se restabelece, a fila e os detalhes são sincronizados silenciosamente em segundo plano.
- **Tratamento de Queda Total no Cliente**: Falhas de transporte de rede (`TypeError: Failed to fetch`) são interceptadas na camada [`apiClient`](frontend/src/shared/api/client.ts) e convertidas em um `ApiError` estruturado com `status: 0`, mensagem clara em português e rastreabilidade pelo `requestId`.
- **Monitoramento de Conectividade em Tempo Real**: O topo da aplicação exibe o status de conexão da estação (`Conectado` com pulso verde ou `Sem conexão` com indicador âmbar), permitindo ao analista distinguir imediatamente problemas locais de rede de indisponibilidades do servidor.
- **Prevenção de Duplo Clique e Requisições Fantasmas**: Mutações em andamento ativam o estado `isPending`, desabilitando botões de despacho e edição. Se a conexão estiver lenta, o operador não consegue disparar comandos duplicados enquanto aguarda o retorno do banco.

### Segurança da API & Controle de Taxa (Rate Limiting)

Para proteger a infraestrutura contra abusos, negação de serviço (DoS) e tempestades de requisições de clientes com reconexões instáveis, a API implementa controle de vazão nativo baseado em **janela deslizante (*Sliding Window*)**:

- **Janela Deslizante Thread-Safe**: Rastreia carimbos de requisições por endereço IP (com extração confiável de proxies reversos via `X-Forwarded-For`), eliminando a vulnerabilidade a rajadas concentradas na virada de minuto (*bursting*) típica de janelas fixas.
- **Headers de Observabilidade IETF**: Cada resposta da API transmite o estado exato da cota do cliente:
  - `X-RateLimit-Limit`: Cota máxima autorizada no período (padrão: 120 req/min);
  - `X-RateLimit-Remaining`: Requisições restantes na janela atual;
  - `X-RateLimit-Reset`: Carimbo epoch em segundos para renovação completa da cota.
- **Resposta Padronizada de Excesso (HTTP 429)**: Ao ultrapassar o limite, a requisição é interceptada antes de alcançar o banco de dados, retornando `HTTP 429 Too Many Requests`, o header `Retry-After: <segundos>` e payload estruturado RFC 7807.
- **Isenção de Endpoints Operacionais**: Endpoints de monitoramento de integridade (`/api/v1/health`), documentação interativa (`/docs`, `/redoc`, `/openapi.json`) e requisições de preflight (`OPTIONS`) são isentos de limitação para garantir a confiabilidade de orquestradores e health checks.

### Triagem em Milissegundos para 100+ Incidentes

- **Design da Informação**: Semáforo visual de criticidade com cores semânticas padronizadas (Rose para *Alta*, Amber para *Média*, Emerald para *Baixa*), placa do veículo em fonte mono de alta legibilidade e cálculo de tempo relativo decorrido.
- **Paginação com Prefetch Preditivo**: Paginação no banco de dados (10 itens/página) combinada com *prefetch* em background da próxima página e da anterior. A troca de página ocorre de forma instantânea, sem atraso perceptível.
- **5 Opções de Ordenação Direta**: Seletor integrado no cabeçalho da fila permitindo priorizar por criticidade (decrescente/crescente), data de criação (recentes/antigos) ou data de última atualização.
- **Gestão por Exceção**:
  - Contadores numéricos em tempo real no topo da fila (`Todos: 100`, `Alta: 33`, `Média: 33`, `Baixa: 34`).
  - Filtros combinados por categoria, status e intervalos de data (Hoje, 7D, 30D ou período customizado).
  - Busca instantânea com *debounce* por placa, título ou rodovia, com atalho de teclado global `/` para foco imediato sem tirar as mãos do teclado.
- **Ergonomia Operacional**: Modo escuro nativo (*Dark Mode*) sem cintilação (*flicker*) para operadores de turno noturno e áreas de toque ampliadas com feedback tátil para operação mobile em campo.

---

## 5. Stack Tecnológica & Decisões de Engenharia

| Tecnologia | Função no Sistema | Racional da Escolha |
| :--- | :--- | :--- |
| **Python 3.12** | Runtime Backend | Performance moderna, suporte nativo a `asyncio` robusto e tipagem estática avançada. |
| **FastAPI** | Framework Web | Alta taxa de transferência assíncrona, injeção de dependências nativa e geração automática de schemas OpenAPI 3.1. |
| **SQLAlchemy 2.0 (Async)** | ORM & Camada SQL | Acesso não-bloqueante ao banco de dados com suporte completo a transações atômicas para OCC. |
| **Pydantic v2** | Validação & Serialização | Core em Rust com validação estrita em nanossegundos e tipagem fortemente declarativa. |
| **React 18 + TypeScript** | Framework Frontend | UI reativa, tipagem ponta a ponta e controle determinístico de ciclo de vida de componentes. |
| **TanStack Query v5** | State de Servidor & Cache | Elimina boilerplate de requisições, gerencia cache em memória, retentativas, prefetching e sincronização reativa de rede. |
| **Tailwind CSS v4** | Estilização | Estilos atômicos de alto desempenho sem runtime CSS-in-JS, com suporte de primeira classe a temas claro/escuro. |
| **Vite** | Bundler Frontend | HMR ultrarrápido, builds otimizados com Rollup e divisão inteligente de pacotes. |
| **Biome & Ruff** | Qualidade & Linting | Linters e formatadores modernos de velocidade extrema garantindo consistência no monorepo. |
| **Pytest & Vitest** | Suíte de Testes | Execução assíncrona veloz, compatibilidade nativa com ESM e isolamento de ambiente. |

---

## 6. Guia de Setup & Execução

### Pré-requisitos
- **Docker** e **Docker Compose** (recomendado para inicialização em 1 comando)
- *Ou para execução local manual:* **Python 3.12+**, **Node.js 20+** e **PostgreSQL 16** (ou SQLite).

### Opção A: Execução via Docker Compose (Recomendada)

1. Clone o repositório:
   ```bash
   git clone https://github.com/ThalysonKaraujo/autou-logos.git
   cd autou-logos
   ```

2. Suba o banco de dados PostgreSQL:
   ```bash
   docker compose up -d
   ```

3. Inicie o backend e o frontend seguindo os passos abaixo ou utilize a configuração de desenvolvimento.

---

### Opção B: Execução Manual dos Serviços

#### 1. Backend (FastAPI)

```bash
cd backend

# Crie e ative o ambiente virtual
python3 -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Configure o arquivo de ambiente
cp .env.example .env

# Execute as migrações do banco de dados
alembic upgrade head

# Popule a base com os 100 incidentes operacionais realistas
python app/core/seed.py

# Inicie o servidor da API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

A API estará acessível em `http://localhost:8000`.
- Documentação interativa Swagger: `http://localhost:8000/docs`
- Documentação ReDoc: `http://localhost:8000/redoc`

#### 2. Frontend (React + Vite)

Em um novo terminal:

```bash
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A interface estará disponível em `http://localhost:5173`.

---

### Banco de Dados & Seed Operacional

O comando `python app/core/seed.py` popula o banco de dados com **100 incidentes realistas** cobrindo:
- Todas as 5 categorias operacionais com descrições técnicas de campo;
- Veículos pesados com padrão de placas Mercosul (`LOG0A10` a `LOG9J19`);
- Localizações rodoviárias autênticas (ex: BR-116, BR-101, Rodovia dos Bandeirantes, Castello Branco);
- Distribuição equilibrada entre criticidades (*Alta*, *Média*, *Baixa*) e status (*Aberto*, *Em Investigação*, *Fechado*, *Inconclusivo*);
- Histórico completo de auditoria com nomes de analistas e notas operacionais de despacho.

---

## 7. Garantia de Qualidade & Testes Automatizados

O projeto adota uma política rigorosa de testes automatizados com abordagem TDD (Red ➜ Green ➜ Refactor), garantindo integridade das regras de negócio e prevenção de regressões tanto no backend quanto no frontend (**62 testes assíncronos no backend** e **90 testes no frontend**).

### Execução dos Testes

#### 1. Backend

Com o ambiente virtual ativo no diretório `backend/`:

```bash
# Executa toda a suíte de testes (62 testes assíncronos)
pytest

# Executa testes com relatório detalhado de execução
pytest -v

# Validação de código com Ruff (linter estático de alta velocidade)
ruff check .
```

**Cobertura de Cenários no Backend:**
- Integridade do ciclo de vida: transições válidas e bloqueio de transições inválidas (`400 Bad Request`);
- Colisões de versão com OCC: rejeição determinística de atualizações concorrentes (`409 Conflict`);
- Filtros combinados: busca textual, categoria, criticidade, intervalo de datas e ordenações;
- Políticas de CORS: validação de origens em desenvolvimento e produção (Vercel);
- Auditoria: criação automática de histórico imutável a cada alteração de estado;
- Controle de vazão: validação do rate limiter em janela deslizante, renovação por IP, headers IETF e resposta com status `429 Too Many Requests`.

#### 2. Frontend

No diretório `frontend/`:

```bash
# Executa a suíte de testes unitários e de integração (90 testes)
npm test -- --run

# Executa a checagem de tipos estáticos do TypeScript
npm run build

# Validação e formatação de código com Biome
npm run lint
```

**Cobertura de Cenários no Frontend:**
- Renderização e acessibilidade de componentes de UI;
- Gerenciamento de estado complexo no hook `useCockpitState` (filtros, paginação, seleção);
- Serialização e desserialização de parâmetros de query no TanStack Query;
- Tolerância a oscilação de conectividade e captura de erro de rede no `apiClient`;
- Detecção e exibição contextual de conflitos OCC via banner informativo.

---

## 8. Ambientes em Nuvem & Documentação da API

A plataforma está provisionada e disponível online para acesso imediato:

| Serviço | Plataforma | URL / Acesso |
| :--- | :--- | :--- |
| **Cockpit Operacional (Frontend)** | Vercel | [https://logos-autou.vercel.app](https://logos-autou.vercel.app) |
| **API RESTful (Backend)** | Render | [https://logos-autou.onrender.com](https://logos-autou.onrender.com) |
| **Documentação Interativa (Swagger)** | Render | [https://logos-autou.onrender.com/docs](https://logos-autou.onrender.com/docs) |
| **Documentação Técnica (ReDoc)** | Render | [https://logos-autou.onrender.com/redoc](https://logos-autou.onrender.com/redoc) |

### Variáveis de Ambiente

As variáveis necessárias para execução em cada ambiente estão documentadas nos arquivos `.env.example`:

#### Backend (`backend/.env`)
| Variável | Descrição | Exemplo Padrão |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Nome do projeto para identificação OpenAPI | `Logos - Central de Incidentes` |
| `ENVIRONMENT` | Ambiente de execução (`development`, `production`) | `development` |
| `DATABASE_URL` | URL de conexão assíncrona do SQLAlchemy | `sqlite+aiosqlite:///./logos.db` ou `postgresql+asyncpg://...` |
| `BACKEND_CORS_ORIGINS` | Lista de origens permitidas para requisições cross-origin | `http://localhost:5173, https://logos-autou.vercel.app` |
| `RATE_LIMIT_ENABLED` | Ativa ou desativa a proteção de rate limiting por IP | `True` |
| `RATE_LIMIT_PER_MINUTE` | Limite máximo de requisições por minuto por IP | `120` |

#### Frontend (`frontend/.env.development` / `frontend/.env.production`)
| Variável | Descrição | Exemplo Padrão |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL base dos endpoints da API REST | `http://localhost:8000/api/v1` (dev) ou `https://logos-autou.onrender.com/api/v1` (prod) |


