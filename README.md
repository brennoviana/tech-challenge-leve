# API de agendas e agendamentos

API do teste técnico Leve Saúde, feita com Node.js, TypeScript, Serverless Framework e AWS Lambda. O API Gateway REST expõe agendas, agendamentos e uma orientação inicial de triagem. Agendas e reservas usam dados fictícios, sem banco de dados.

## Executar localmente

Requer Node.js 20.6 ou superior e uma License Key do Serverless Framework v4.

```bash
npm ci
cp .env.example .env
```

Configure as variáveis conforme o uso. O `.env` está ignorado pelo Git:

| Variável                 | Quando usar                                                                                              | Padrão                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `SERVERLESS_LICENSE_KEY` | Obrigatória para iniciar o Serverless v4 e fazer deploy                                                  | Nenhum                                                    |
| `OPENAI_API_KEY`         | Necessária para `POST /triagem`; as outras rotas funcionam sem ela                                       | Nenhum                                                    |
| `OPENAI_MODEL`           | Opcional: modelo compatível com Structured Outputs                                                       | `gpt-4o-mini`                                             |
| `LOG_LEVEL`              | Opcional: nível mínimo dos logs (`error`, `warn`, `info`, `debug`)                                       | `info`                                                    |
| `HTTP_PORT`              | Opcional: porta do servidor local                                                                        | `3000`                                                    |
| `DEMO_API_KEY`           | Necessária para os exemplos com `curl` e os testes HTTP; copie a chave exibida pelo `serverless-offline` | Nenhum                                                    |
| `E2E_BASE_URL`           | Opcional: URL base para os testes HTTP, incluindo o estágio                                              | `http://localhost:3000/dev` (usa `HTTP_PORT` se definido) |

Depois, inicie a API:

```bash
npm run dev
```

Por padrão, a API local fica em `http://localhost:3000/dev`. Se alterar `HTTP_PORT`, use a nova porta na URL e no Insomnia. Para os exemplos com `curl`, copie a chave `Key with token` exibida pelo `serverless-offline`:

```bash
export DEMO_API_KEY='cole-a-chave-exibida-no-terminal'
```

## API

| Método | Rota           | Resposta                                 |
| ------ | -------------- | ---------------------------------------- |
| `GET`  | `/agendas`     | `200` com médicos e horários disponíveis |
| `POST` | `/agendamento` | `201` com o agendamento criado           |
| `POST` | `/triagem`     | `200` com orientação inicial             |

### Collection do Insomnia

Se preferir testar pelo Insomnia, importe o arquivo [insomnia-collection.yaml](doc/insomnia-collection.yaml) em **Import > File**. A collection contém as três rotas e seus exemplos de payload. Em **Base Environment**, preencha `api_key` com a chave exibida pelo `serverless-offline` e mantenha `base_url` como `http://localhost:3000/dev`. Execute `GET /agendas` e copie um horário do médico 1 diretamente para o campo `data_horario` no corpo de `POST /agendamento`.

Para listar as agendas:

```bash
curl -i http://localhost:3000/dev/agendas \
  -H "x-api-key: $DEMO_API_KEY"
```

Para criar um agendamento, copie um valor de `horarios_disponiveis` retornado por `GET /agendas` e substitua `HORARIO_DO_GET`:

```bash
curl -i -X POST http://localhost:3000/dev/agendamento \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $DEMO_API_KEY" \
  -d '{"agendamento":{"medico_id":1,"paciente":"Carlos Almeida","data_horario":"HORARIO_DO_GET"}}'
```

O `GET` retorna `medicos` com `id`, `nome`, `especialidade` e `horarios_disponiveis`. O `POST` retorna `mensagem` e `agendamento` com UUID, médico, paciente e horário. O formato de data e hora aceito é `AAAA-MM-DD HH:mm`. Os cinco horários do mock são gerados de 1 a 5 dias após a data atual em `America/Sao_Paulo`; consulte `GET /agendas` para obter um horário válido antes de agendar.

Para solicitar uma orientação inicial de triagem:

```bash
curl -i -X POST http://localhost:3000/dev/triagem \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $DEMO_API_KEY" \
  -d '{"sintomas":"Estou com manchas na pele há dois dias."}'
```

Todas as rotas exigem o header `x-api-key`; sem uma chave válida, o API Gateway responde `403` antes de chamar a Lambda. No deploy, consulte a chave gerada com `npx serverless info --stage demo` e compartilhe o valor apenas com os avaliadores. O plano de uso define uma cota-alvo compartilhada de 100 chamadas por dia, com taxa de 2 chamadas por segundo e pico de 3. Esses limites são aproximados e não garantem um teto de gastos; a API key também não substitui autenticação. Não coloque a chave em uma página pública nem no repositório. Após a demonstração, revogue a chave ou remova o ambiente.

O campo `sintomas` aceita texto de 3 a 1000 caracteres. A resposta contém `triagem.prioridade` (`emergencia`, `avaliacao_breve` ou `consulta_eletiva`), `triagem.especialidade_sugerida`, `triagem.orientacao` e `aviso`. Por exemplo:

```json
{
  "triagem": {
    "prioridade": "consulta_eletiva",
    "especialidade_sugerida": "Dermatologia",
    "orientacao": "Procure avaliação de um profissional de saúde."
  },
  "aviso": "Esta orientação não substitui avaliação médica. Em caso de sintomas graves ou piora, procure atendimento de urgência."
}
```

A triagem é uma orientação automatizada, sem diagnóstico, prescrição ou garantia de disponibilidade da especialidade sugerida. Ela não substitui avaliação profissional. O relato é enviado à API da OpenAI; evite incluir nome, documentos ou outros dados pessoais. A integração usa `store: false`, que desativa o armazenamento da resposta para recuperação pela API, mas não equivale a retenção zero de todos os dados. Consulte os [controles de dados da OpenAI](https://developers.openai.com/api/docs/guides/your-data).

| Situação em qualquer rota                 | Status |
| ----------------------------------------- | ------ |
| Chave de demonstração ausente ou inválida | `403`  |

| Situação no `POST /agendamento`        | Status |
| -------------------------------------- | ------ |
| Payload ausente ou inválido            | `400`  |
| Médico inexistente                     | `404`  |
| Horário fora da agenda ou já reservado | `409`  |

| Situação no `POST /triagem`                     | Status |
| ----------------------------------------------- | ------ |
| JSON ausente, inválido ou sintomas inválidos    | `400`  |
| API de triagem indisponível ou sem chave OpenAI | `503`  |

## Verificações

```bash
npm run typecheck
npm test
npm run test:e2e
npm run lint
npm run format:check
```

Os testes ponta a ponta fazem requisições HTTP reais. Com `npm run dev` ativo em outro terminal, coloque a chave exibida pelo servidor em `DEMO_API_KEY` no `.env` e execute `npm run test:e2e`. O script carrega `.env` automaticamente; uma variável definida no terminal tem prioridade. Reinicie o servidor antes de repetir os testes, pois as reservas ficam em memória. Se a API estiver em outra URL, defina `E2E_BASE_URL` com a URL base completa, incluindo o estágio, e use a chave desse ambiente.

## Organização

O código está organizado por funcionalidade em `src/features/list-schedules`, `src/features/create-appointment` e `src/features/triage`. Cada uma contém seu caso de uso, interfaces e infraestrutura. Contratos e recursos compartilhados ficam em `src/shared`.

O projeto aplica conceitos de DDD e Clean Architecture: `Doctor` verifica se oferece um horário, `Appointment` representa a reserva e os casos de uso dependem de interfaces. O payload de agendamento é validado com Zod na camada HTTP antes de chegar ao caso de uso. As implementações de HTTP, AWS e repositórios em memória ficam na infraestrutura. As dependências concretas são injetadas nos casos de uso, que não conhecem API Gateway.

Na triagem, `TriageUseCase` depende de `TriageAdvisorInterface`. A implementação OpenAI fica em `infra/llm` e usa a [Responses API com Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). A saída é validada antes de chegar ao caso de uso. Outra LLM pode substituir esse adapter implementando a mesma interface, sem mudar o contrato HTTP nem a aplicação. Falhas externas, respostas incompletas e recusas retornam `503`; a API não registra o texto dos sintomas em logs.

As Lambdas chamam handlers HTTP finos. O `POST` valida o JSON com um schema Zod antes de executar o caso de uso. O decorator `@LogRequest` registra rota, status e duração. Um wrapper do Winston escreve uma linha JSON por evento no console da Lambda, com nível, horário e serviço. `LOG_LEVEL` controla o nível mínimo (`error`, `warn`, `info` ou `debug`; padrão `info`). Erros registram o tipo, sem mensagem ou stack; sintomas, nomes de pacientes, corpos HTTP e chaves não entram nos logs. Falhas da OpenAI registram apenas status e código de erro seguro.

**Limite do mock:** cada instância Lambda mantém seu próprio estado em memória. Uma reserva feita no `POST` não altera a lista retornada pelo `GET`, que usa outro repositório. Reinícios ou instâncias paralelas também não compartilham reservas nem garantem exclusividade global.

## Deploy

Configure suas credenciais AWS e as variáveis `SERVERLESS_LICENSE_KEY` e `OPENAI_API_KEY` no ambiente de deploy. As credenciais podem vir de um perfil configurado (`AWS_PROFILE`) ou de `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` (com `AWS_SESSION_TOKEN` se forem temporárias). Depois execute:

```bash
npx serverless deploy
```

O `serverless.yml` configura API Gateway REST e runtime `nodejs24.x`. O deploy não é necessário para executar a API localmente. Para consultar a chave e a URL do ambiente de demonstração, use `npx serverless info` e mantenha a chave fora de canais públicos.
