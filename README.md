# API de agendas e agendamentos — teste técnico Leve Saúde

API em TypeScript com duas funções AWS Lambda acionadas pelo API Gateway REST: `GET /agendas` lista os médicos e `POST /agendamento` registra uma consulta. Os dados são fictícios e seguem o contrato do [enunciado](./teste-tecnico-levesaude-dev.pdf).

Os nomes de módulos, classes e funções internos estão em inglês. Os campos de dados que representam o contrato HTTP, as rotas e as mensagens da API seguem o enunciado em português.

## Executar localmente

Requer Node.js 20 ou superior. Com npm:

```bash
npm ci
cp .env.example .env
npm run dev
```

Antes de iniciar, substitua o valor de `SERVERLESS_LICENSE_KEY` no arquivo `.env` pela sua License Key. O Serverless Framework v4 lê o `.env` local e usa essa variável para autenticar o CLI, inclusive no comando `offline`, sem `serverless login`. O arquivo `.env` está ignorado pelo Git; mantenha a chave fora do `serverless.yml` e de commits. Você também pode definir `SERVERLESS_LICENSE_KEY` no ambiente do terminal em vez de criar o arquivo. Consulte a [documentação de License Keys](https://www.serverless.com/framework/docs/guides/license-keys) e de [carregamento do `.env`](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml#dotenv-files).

Use a URL exibida pelo `serverless-offline`. Exemplos, se a base local for `http://localhost:3000/dev`:

```bash
curl -i http://localhost:3000/dev/agendas

curl -i -X POST http://localhost:3000/dev/agendamento \
  -H 'Content-Type: application/json' \
  -d '{"agendamento":{"medico_id":1,"paciente":"Carlos Almeida","data_horario":"2026-06-10 09:00"}}'
```

O `GET` responde `200` com `medicos`, incluindo `id`, `nome`, `especialidade` e `horarios_disponiveis`. O `POST` responde `201` com `mensagem` e `agendamento` (`id` UUID, `medico`, `paciente` e `data_horario`). Payload inválido recebe `400`, médico inexistente recebe `404` e horário fora da agenda ou já reservado recebe `409`. A data deve usar `AAAA-MM-DD HH:mm`; o nome do paciente não pode estar vazio. As datas do mock reproduzem o exemplo do PDF e são ilustrativas.

## Verificações

```bash
npm run typecheck
npm test
npm run test:e2e
npm run lint
npm run format:check
```

Para os testes E2E, inicie `npm run dev` em outro terminal e execute `npm run test:e2e` com o servidor recém-iniciado. Eles fazem requisições HTTP reais às rotas locais e verificam listagem, criação, conflito e validação. Se a API estiver em outra URL, defina `E2E_BASE_URL` (incluindo o estágio, se houver). Reinicie o servidor antes de repetir os testes: as reservas do mock ficam na memória da Lambda enquanto ela estiver ativa. `npm test` roda apenas os testes rápidos, sem depender do servidor.

## Organização

O código está organizado por funcionalidade. Cada pasta reúne o caso de uso, suas portas, a Lambda, o adapter HTTP e o repositório concreto:

```text
src/
  features/
    list-schedules/
      application/
      infra/
    create-appointment/
      domain/
      application/
      infra/
  shared/
    domain/   # contrato de médico usado pelas duas funcionalidades
    infra/    # médicos fictícios e resposta JSON
tests/
  list-schedules/
  create-appointment/
```

As duas Lambdas têm repositórios concretos separados. O que é comum fica em `shared`: o contrato `Doctor`, a função que cria os médicos fictícios e o formato básico da resposta JSON. Os casos de uso dependem das suas próprias interfaces, sem importar código de AWS.

Os handlers HTTP são classes com casos de uso injetados. No `POST`, o handler chama a classe de validação, que usa um schema Zod para verificar o payload antes de executar o caso de uso. O decorator `@LogRequest` registra rota e status HTTP sem registrar o corpo da requisição nem dados do paciente. As funções exportadas em `lambda.ts` são os pontos de entrada exigidos pela AWS.

O domínio de `Appointment` guarda `doctorId`. O nome do médico na resposta do `POST` vem do médico que o caso de uso já consultou; não é armazenado novamente no agendamento.

**Limite do mock:** o estado em memória pertence a cada instância Lambda. O `POST` detecta conflito entre reservas que chegam à mesma instância; o `GET` usa outro repositório e não reflete essas reservas. Reinícios e execução paralela também impedem garantia de persistência ou exclusividade global. Os testes verificam o conflito em uma mesma instância do repositório de agendamentos. O [guia de implementação](./PASSO_A_PASSO.md) reúne os requisitos.

## Deploy

O `serverless.yml` usa API Gateway REST e runtime `nodejs24.x`. Para publicar na AWS, configure as credenciais AWS e execute `npx serverless deploy`. Nenhum deploy é necessário para executar a rota localmente.
# tech-challenge-leve
# tech-challenge-leve
# tech-challenge-leve
# tech-challenge-leve
