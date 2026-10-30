# Nome da funcionalidade

## Escopo
Front-End, Back-end, Banco de dados

## Contexto
Precisamos implementar o fluxo para criacao de contas na plataforma, as pessoas precisarao fornecer:
- Primeiro Nome
- Sobrenome
- Email
- Senha
- Confirmacao de senha

## Requisitos funcionas
1. Precisamos adicionar validacao no formulario na camada de cliente
  1. Caso o formulario esteha valida podemos enviar a requisicao para a API
2. Os campos de nome e sobrenome devem ser separados 
3. Precisamos criar uma nova conta no banco de dados na tabela de `accounts`
    1. `id`: nanoid (gerado com `nanoid` na camada de API)
    2. `first_name`: text
    3. `last_name`: text
    4. `created_at`: timestamp
    5. `updated_at`: timestamp 
    6. `active`: boolean
    7. `email`: text
    8. `password`: text (hash gerado com `bcryptjs`, que ja inclui o salt)
4. A requisicao deve ser um `POST` para `/api/v1/sign-up` e receber os dados como JSON no `body`
5. Caso tudo de certo retornar `201` ou erros de acordo com a validacao:
   1. `400`: Ma formacao de dados


## Requisitos nao funcionais
- Seguranca: Precisamos salvar as senhas de fomra segura no banco de dados
    - Precisamos receber os dados do clinte de forma segura usando HTTPS (para previnir network sniff)
- UI/UX: Boa experiencia de uso atraves de uma interface bonita, elegante, moderna
- Performance: O processo de criacao de conta precisa se rapido

## Voce deve
- Criar a base do projeto com um endpoint inicial para criacao de conta
- Criar a base do projeto com uma pagina inicial para a interface de criacao de conta
- Configurar as bibliotecas base


## Voce nao deve
- Implementar qualquer outra funcionalidade que nao esteja relacionada com sing-up (criacao de contas.)
- Nao vamos realizar nenhum envio de email no momento, apenas processar a requisicao, salvar no banco de dados e retornar um sucesso.

## Tecnologias (Stack)  
React.js, Next.js, React-Hook-form, Shadcn, Tailwild, Supabase, TRCP

## Criterios de aceitacao
- Temos uma pagina para criar a nova conta em `/auth/sign-up`
- A pagina contem um formulario com validacao
- A plataforma consegue se comunicar com a API para enviar os dados e receber uma resposta
- Estamos informando possiveis erros
    - Mostrar um alert em vermelho no formulario
- Estamos informando o sucesso de criacao de contas:
    - Navegar para `auth/sign-up/success`

## Resultado
Pessoas conseguem criar uma nova conta na plataforma
