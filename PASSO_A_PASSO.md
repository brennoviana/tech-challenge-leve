# Passo a passo do teste técnico Leve Saúde

Fonte: [`teste-tecnico-levesaude-dev.pdf`](./teste-tecnico-levesaude-dev.pdf), páginas 1 a 4. Este guia transforma o enunciado em uma sequência de implementação. Os exemplos de JSON abaixo reproduzem o contrato apresentado no PDF; os dados são fictícios.

## 1. Entenda o que precisa ser entregue

Crie uma API em **Node.js 20 ou superior e TypeScript**, usando **Serverless Framework**, funções **AWS Lambda** acionadas por **API Gateway REST** e **serverless-offline** para execução local. Não use banco de dados real: médicos, horários e reservas podem ficar em memória.

| Rota | Função | Resultado principal |
| --- | --- | --- |
| `GET /agendas` | Listar médicos e horários disponíveis | `200` com `medicos` |
| `POST /agendamento` | Registrar uma consulta | `201` com o agendamento criado |
| `POST /agendamento` | Rejeitar horário indisponível | `409` com erro de conflito |

Além das rotas, são **obrigatórios**: validação do payload e erros HTTP adequados; testes unitários da lógica de negócio com **Jest**; TypeScript com tipos explícitos e sem `any`; ESLint e Prettier; README com execução local e instruções de deploy; código em um **repositório Git público**. Fazer o deploy de fato é opcional no enunciado, mas documentar como fazê-lo é requisito.

**Diferenciais opcionais:** testes de integração ou ponta a ponta, decorators para aspectos transversais e `POST /triagem` integrado a um LLM. Termine o núcleo obrigatório antes de acrescentá-los.

## 2. Prepare o projeto

1. Confirme a versão do Node com `node --version` e escolha um gerenciador de pacotes, por exemplo npm.
2. Inicie o projeto e instale as ferramentas. Uma combinação possível com npm é:

   ```bash
   npm init -y
   npm install -D typescript @types/node serverless serverless-offline jest ts-jest @types/jest eslint @eslint/js typescript-eslint prettier
   ```

   Configure Jest para transformar os arquivos TypeScript com `ts-jest`, ESLint para analisar TypeScript e Prettier para formatá-lo. Mantenha o `package-lock.json` no repositório.
3. Ative verificação estrita no `tsconfig.json` (`strict: true`) e configure scripts como `dev` (`serverless offline`), `typecheck` (`tsc --noEmit`), `test` (`jest`), `lint` (`eslint .`) e `format` (`prettier --write .`) no `package.json`.
4. Crie `.gitignore` para `node_modules`, artefatos de build, arquivos de ambiente e saídas locais do Serverless. Não publique credenciais.

> As opções concretas de build podem variar conforme a versão instalada do Serverless. Verifique o empacotamento de TypeScript e rode a API pelo `serverless-offline` antes de avançar. Referências: [configuração do Serverless](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml), [build](https://www.serverless.com/framework/docs/providers/aws/guide/building) e [serverless-offline](https://github.com/dherault/serverless-offline).

## 3. Configure as rotas REST no Serverless

No `serverless.yml`, defina o provedor `aws`, um runtime Node compatível com o requisito (este projeto usa `nodejs24.x`), as funções e o plugin `serverless-offline`. Para **API Gateway REST**, declare eventos `http`; `httpApi` configura a modalidade HTTP API, que é diferente da pedida no PDF.

```yaml
service: leve-saude-api
licenseKey: ${env:SERVERLESS_LICENSE_KEY}

provider:
  name: aws
  runtime: nodejs24.x

plugins:
  - serverless-offline

functions:
  listSchedules:
    handler: src/features/list-schedules/infra/aws/lambda.handler
    events:
      - http:
          path: agendas
          method: get
  createAppointment:
    handler: src/features/create-appointment/infra/aws/lambda.handler
    events:
      - http:
          path: agendamento
          method: post
```

O projeto lê `SERVERLESS_LICENSE_KEY` do `.env` local, que deve permanecer fora do Git. Confirme que ambas as rotas respondem localmente. A [documentação do Serverless para eventos REST](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml#api-gateway-v1-rest-api) mostra a distinção entre `http` e `httpApi`.

## 4. Defina os dados e as regras de negócio

Crie tipos para `Doctor`, `Appointment`, `CreateAppointmentInput` e as respostas da API. Use os nomes externos exigidos no JSON (`horarios_disponiveis`, `medico_id`, `data_horario`) ou faça uma conversão explícita entre esses nomes e os tipos internos.

Use uma pequena lista fixa de médicos, especialidades e horários. O exemplo do PDF usa dois médicos: Dr. João Silva, cardiologista, e Dra. Maria Souza, dermatologista. As datas `2026-06-10` e `2026-06-11` são **exemplos do PDF**; você pode manter esses valores para reproduzir o contrato ou usar datas futuras, desde que os dados e exemplos do README sejam coerentes. Defina qual formato de data/hora a API aceita (`AAAA-MM-DD HH:mm`) e não dependa de conversão implícita de fuso horário pelo JavaScript.

Separe o armazenamento mockado atrás de interfaces: uma porta para listar agendas e outra para encontrar médico e registrar uma reserva. Injete cada porta no respectivo caso de uso. Assim, os testes usam implementações em memória isoladas, sem mocks globais.

Regra sugerida para o serviço de agendamento:

1. Receber um `medico_id`, um nome de paciente e um `data_horario` já validados.
2. Verificar se o médico existe. Para ID desconhecido, retornar erro adequado, por exemplo `404`.
3. Verificar se o horário pertence à agenda daquele médico e ainda está livre. Se não estiver, retornar `409`.
4. Gerar um UUID, registrar a reserva e devolver médico, paciente e horário com `201`.
5. Fazer o `GET` listar os horários disponíveis da fonte de dados usada por ele.

**Limite importante do mock:** memória de processo não é compartilhada de forma confiável entre funções ou instâncias Lambda. Com as duas funções separadas no YAML acima, não conte com o `GET` refletindo uma reserva feita pelo `POST` em AWS. O `POST` pode detectar um segundo pedido para o mesmo horário quando as chamadas atingem a mesma instância em memória; isso não garante proteção contra chamadas paralelas nem contra reinícios. Documente essa limitação no README. Se quiser demonstrar as duas rotas com estado compartilhado na execução local, uma opção é ligá-las à mesma função Lambda e delegar cada rota a um handler fino; isso ainda não cria persistência confiável em produção. O PDF aceita controle de conflito em memória e não exige banco de dados.

## 5. Implemente o `GET /agendas`

O handler deve chamar o serviço de consulta e serializar uma resposta JSON com status `200`. Formato esperado:

```json
{
  "medicos": [
    {
      "id": 1,
      "nome": "Dr. João Silva",
      "especialidade": "Cardiologista",
      "horarios_disponiveis": [
        "2026-06-10 09:00",
        "2026-06-10 10:00",
        "2026-06-10 11:00"
      ]
    },
    {
      "id": 2,
      "nome": "Dra. Maria Souza",
      "especialidade": "Dermatologista",
      "horarios_disponiveis": [
        "2026-06-11 14:00",
        "2026-06-11 15:00"
      ]
    }
  ]
}
```

## 6. Implemente o `POST /agendamento`

Leia o corpo JSON e valide sua estrutura antes de chamar o serviço. O payload do PDF é:

```json
{
  "agendamento": {
    "medico_id": 1,
    "paciente": "Carlos Almeida",
    "data_horario": "2026-06-10 09:00"
  }
}
```

Valide pelo menos: JSON válido; objeto `agendamento` presente; `medico_id` inteiro válido; `paciente` como texto não vazio; `data_horario` como texto no formato escolhido. Retorne `400` para payload inválido. Erros de negócio devem ter significado explícito, por exemplo `DoctorNotFoundError` e `TimeSlotUnavailableError`, com mapeamento centralizado para status HTTP. Evite transformar todo erro em `500` ou colocar as regras dentro do handler.

Na reserva bem-sucedida, retorne **`201`**:

```json
{
  "mensagem": "Agendamento realizado com sucesso",
  "agendamento": {
    "id": "uuid-gerado",
    "medico": "Dr. João Silva",
    "paciente": "Carlos Almeida",
    "data_horario": "2026-06-10 09:00"
  }
}
```

Quando o horário estiver indisponível, retorne **`409`** com o formato pedido:

```json
{
  "erro": "Horário indisponível",
  "mensagem": "O horário solicitado não está mais disponível para este médico."
}
```

## 7. Organize o código para facilitar testes e manutenção

Este projeto usa uma pasta por funcionalidade, com as camadas dentro de cada uma:

```text
src/
  features/
    list-schedules/
      application/  # caso de uso e porta de leitura
      infra/        # Lambda, adapter HTTP e repositório de consulta
    create-appointment/
      domain/       # agendamento e erros de negócio
      application/  # caso de uso e portas de reserva/ID
      infra/        # Lambda, validação, adapter HTTP e repositório de reserva
  shared/           # contrato de médico, fixture e resposta JSON
tests/
  list-schedules/
  create-appointment/
serverless.yml
README.md
```

O fluxo é: **API Gateway → Lambda → adapter HTTP → caso de uso → repositório mockado**. O adapter valida a entrada e traduz o resultado em status, headers e JSON. O caso de uso não conhece detalhes de API Gateway. Essa separação cobre os pontos arquiteturais valorizados no PDF: responsabilidade única, injeção de dependências, decisões justificáveis e erros de negócio tipados.

## 8. Escreva e rode os testes

Com Jest, teste os serviços usando um repositório em memória novo em cada teste. Cubra pelo menos:

- Listagem retorna médicos e horários esperados.
- Agendamento válido retorna os dados certos e um ID gerado.
- Nova tentativa no mesmo horário do mesmo médico gera conflito.
- Médico inexistente e horário fora da agenda geram os erros definidos.
- Payload ausente, malformado ou com campos inválidos recebe `400` na camada HTTP/validação.
- Falhas inesperadas recebem `500` sem expor detalhes internos, caso você tenha um mapeador de erros.

Depois rode os scripts de teste, checagem de tipos e lint. Se adicionar testes de integração, chame a API pelo `serverless-offline` e verifique status e corpo das respostas. Testes de integração são diferenciais, não substituem os unitários exigidos.

## 9. Valide a execução local

Inicie o script `dev` que executa `serverless offline`. Use a URL e a porta mostradas no terminal. Exemplos, se a base for `http://localhost:3000`:

```bash
curl -i http://localhost:3000/agendas

curl -i -X POST http://localhost:3000/agendamento \
  -H 'Content-Type: application/json' \
  -d '{"agendamento":{"medico_id":1,"paciente":"Carlos Almeida","data_horario":"2026-06-10 09:00"}}'
```

Confira o caminho efetivo exibido pelo `serverless-offline`, que pode incluir um estágio na URL dependendo da configuração. Verifique manualmente `200`, `201`, `400` e `409` no fluxo local, considerando o limite de estado em memória descrito no passo 4.

## 10. Documente e entregue

No `README.md` do projeto implementado, inclua:

1. Objetivo e tecnologias usadas.
2. Pré-requisitos, versão do Node e comando de instalação (`npm ci`).
3. Comandos para iniciar localmente, testar, checar tipos, lint e formatar.
4. Rotas, exemplos de requisição e resposta, códigos de status e formato de data/hora.
5. Explicação das decisões de arquitetura, do mock e dos limites da memória Lambda.
6. Instruções para deploy com Serverless e pré-requisitos de credenciais AWS, mesmo que você não faça o deploy.

Por fim, rode as verificações, confirme que a API funciona a partir de uma instalação limpa, faça o commit dos arquivos necessários e publique o código em um repositório Git público. A avaliação considera qualidade do código, TypeScript, Serverless, design da API, arquitetura, testes e clareza da documentação (PDF, página 4).

## Ordem de prioridade

**Primeiro:** duas rotas corretas, mock, validação e conflito. **Depois:** separação de camadas, testes unitários, lint/format e README completo. **Por último:** diferenciais opcionais, caso haja tempo. O endpoint de triagem com IA exige tratamento de falhas externas e separação da chamada ao modelo; não faz parte do mínimo necessário para concluir o teste.
