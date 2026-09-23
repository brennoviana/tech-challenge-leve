# API de agendas e agendamentos

API do teste técnico Leve Saúde, feita com Node.js, TypeScript, Serverless Framework e AWS Lambda. O API Gateway REST expõe duas rotas com dados fictícios, sem banco de dados.

## Executar localmente

Requer Node.js 20 ou superior e uma License Key do Serverless Framework v4.

```bash
npm ci
cp .env.example .env
```

Preencha `SERVERLESS_LICENSE_KEY` no `.env` ou defina a variável no terminal. O `.env` está ignorado pelo Git. Depois, inicie a API:

```bash
npm run dev
```

Use a URL exibida pelo `serverless-offline`. Por padrão, as rotas locais ficam em `http://localhost:3000/dev`.

## API

| Método | Rota           | Resposta                                 |
| ------ | -------------- | ---------------------------------------- |
| `GET`  | `/agendas`     | `200` com médicos e horários disponíveis |
| `POST` | `/agendamento` | `201` com o agendamento criado           |

Para listar as agendas:

```bash
curl -i http://localhost:3000/dev/agendas
```

Para criar um agendamento:

```bash
curl -i -X POST http://localhost:3000/dev/agendamento \
  -H 'Content-Type: application/json' \
  -d '{"agendamento":{"medico_id":1,"paciente":"Carlos Almeida","data_horario":"2026-06-10 09:00"}}'
```

O `GET` retorna `medicos` com `id`, `nome`, `especialidade` e `horarios_disponiveis`. O `POST` retorna `mensagem` e `agendamento` com UUID, médico, paciente e horário. O formato de data e hora aceito é `AAAA-MM-DD HH:mm`; as datas do mock reproduzem o exemplo do enunciado.

| Situação no `POST`                     | Status |
| -------------------------------------- | ------ |
| Payload ausente ou inválido            | `400`  |
| Médico inexistente                     | `404`  |
| Horário fora da agenda ou já reservado | `409`  |

## Verificações

```bash
npm run typecheck
npm test
npm run test:e2e
npm run lint
npm run format:check
```

Os testes ponta a ponta fazem requisições HTTP reais. Com `npm run dev` ativo em outro terminal, execute `npm run test:e2e`. Reinicie o servidor antes de repeti-los, pois as reservas ficam em memória. Se a API estiver em outra URL, defina `E2E_BASE_URL` com a URL base completa, incluindo o estágio.

## Organização

O código está organizado por funcionalidade em `src/features/list-schedules` e `src/features/create-appointment`. Cada uma contém seu caso de uso, portas e infraestrutura. Contratos e recursos compartilhados ficam em `src/shared`.

O projeto aplica conceitos de DDD e Clean Architecture: o agendamento tem modelo e erros de domínio; os casos de uso dependem de portas; e as implementações de HTTP, AWS e repositórios em memória ficam na infraestrutura. As dependências concretas são injetadas nos casos de uso, que não conhecem API Gateway.

As Lambdas chamam handlers HTTP finos. O `POST` valida o JSON com um schema Zod antes de executar o caso de uso. O decorator `@LogRequest` registra rota e status sem registrar dados do paciente.

**Limite do mock:** cada instância Lambda mantém seu próprio estado em memória. Uma reserva feita no `POST` não altera a lista retornada pelo `GET`, que usa outro repositório. Reinícios ou instâncias paralelas também não compartilham reservas nem garantem exclusividade global.

## Deploy

Configure suas credenciais AWS e a variável `SERVERLESS_LICENSE_KEY`. Depois execute:

```bash
npx serverless deploy
```

O `serverless.yml` configura API Gateway REST e runtime `nodejs24.x`. O deploy não é necessário para executar a API localmente.
