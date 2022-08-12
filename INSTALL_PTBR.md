# 🇧🇷 Instalação

## Configurações iniciais

Antes de mais nada, execute o comando a seguir para instalar todas as dependências.

```bash
yarn 
# OU
npm i
```

Após renomear o arquivo `.env.example` para apenas `.env`, altere (inicialmente) a variável referente ao banco de dados. As demais varíaveis serão alteradas ao decorrer deste guia.

```env
DATABASE_URL="mysql://{USUARIO DO BANCO DE DADOS}:{SENHA DO BANCO DE DADOS}@{ENDEREÇO DO BANCO DE DADOS}/{NOME DA BASE DE DADOS}"
```

Inicialize o banco de dados com o seguinte comando:

```bash
npx prisma init
```

Migre as tabelas do model para a base de dados (existem duas formas de se fazer isto)

```bash
npx prisma db push
#OU
npx prisma migrate dev --name="nome da migration"
```

Configurações iniciais feitas! Agora vamos às integrações.

## Integrando com o chat da Twitch

É recomendado que você crie uma conta para o seu Bot. Você pode usar sua conta principal, só vai parecer que é você respondendo a todos os comandos enviados pelos usuários (pode parecer estranho...). Geralmente criamos uma conta com o nome do canal + bot. Fique a vontade.
IMPORTANTE: caso vá utilizar a sua conta para responder aos comandos, o processo a seguir só precisa ser feito uma vez. Caso vá usar uma conta 'bot', você precisará fazer o processo a seguir na conta 'bot' e na sua conta principal também.

- Logado com a conta que você vai usar como o responsável por responder aos comandos, acesse a dashboard de API da Twitch através [deste link](https://dev.twitch.tv/console).
- Clique na aba Aplicativos, então clique em "+ Registre seu aplicativo"
- Dê o nome que você quiser (deve ser único na plataforma, então seja criativo) para o seu aplicativo. No campo "URLS de redirecionamento OAuth", digite http://localhost:3003 e em Categoria, escolha Chat Bot e então clique em Criar.
- Seu aplicativo agora vai estar na lista de aplicativos. Clique no botão Gerenciar. Na tela que exibe as informações do seu aplicativo, clique em "Novo segredo". Agora você precisa copiar o ID do cliente e o Segredo do cliente.

Agora você precisa gerar o "code" necessário para que nossa aplicação funcione. Para isto, acesse o link: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id={COLOQUE O CLIENT ID COPIADO ANTERIOMENTE AQUI}&redirect_uri=http://localhost:3003&scope=chat:read+chat:edit+channel:read:redemptions+channel:manage:redemptions&token_type=bearer`<br/>
O retorno será "your code is: {seu code}".
<br/><br/>

Agora você tem 3 informações (assim espero):

- Client ID<br/>
- Client Secret<br/>
- Code<br/>
  
<br/>

Abra o arquivo `.env` localizado na raiz do projeto e substitua as informações a seguir:

```env
TWITCH_BOT_USERNAME="nome da conta usada como seu respondedor de comandos, exemplo: oninjabot"
TWITCH_OAUTH="oauth:pvsv0uwo81db0663qsn1btg4vvkuiy"
TWITCH_CHANNEL="nome do seu canal, exemplo: oninjadev"

BOT_TWITCH_CLIENT_ID="coloque aqui o client id da conta responsavel por responder comandos"
BOT_TWITCH_SECRET="coloque aqui o client secret da conta responsavel por responder comandos"

TWITCH_CLIENT_ID="coloque aqui o client id da sua conta principal"
TWITCH_SECRET="coloque aqui o client secret da sua conta principal"
```

<br/><br/>

Agora você vai precisar gerar seu access token e seu refresh token. Pra isso você vai precisar fazer uma chamada POST para a url https://id.twitch.tv/oauth2/token .
Eu utilizei o Postman! Deixe os campos "grant_type" como authorization_code e "redirect_uri" como http://localhost:3003 . Estamos falando de uma chamada http POST com parametros GET. Se você está seguindo a convenção e criou uma conta bot, você terá de fazer duas chamadas como a que segue, preenchendo as chaves de acordo com as duas contas (a principal e a do bot)

![Postman configs](/resources/postman%20config.png?raw=true")

O retorno desta chamada **deve** ser algo como:

```json
{
    "access_token": "access token gerado",
    "expires_in": 13477,
    "refresh_token": "refresh token gerado",
    "scope": [
        "channel:manage:redemptions",
        "channel:read:redemptions",
        "chat:edit",
        "chat:read"
    ],
    "token_type": "bearer"
}
```

Você deve adaptar o resultado aos arquivos JSON aos arquivos correspondentes. Os arquivos se encontram na pasta `src/jsons`. São eles: twitch_main_tokens.json que corresponde ao resultado JSON da sua conta principal (conta do streamer) e twitch_bot_tokens.json que corresponde ao resultado JSON da conta que irá responder aos comandos dos usuários do chat. O arquivo **deve** ter a seguinte estrutura:

```json
{
    "accessToken": "cole aqui a access token gerada",
    "refreshToken": "cole aqui a refresh token gerada",
    "scope": [
        "channel:manage:redemptions",
        "channel:read:redemptions",
        "chat:edit",
        "chat:read"
    ],
    "expiresIn": 13748,
    "obtainmentTimestamp": 0
}
```

### Passo opcional: compra de itens via loja da stream

Caso você queira utilizar a loja de pontos da Twitch para ler as compras do usuário e efetivar/devolver os pontos gastos, você precisa criar essas recompensas via API. Se tentar mudar o status da "compra de item" para "COMPLETADO" ou "RECUSADO" de um item que foi criado direto do dashboard, a ação não será completada, causando um erro de origem de crição do item (os CLIENT_ID são diferentes dashboard/API). Para criar um item via API, insira dentro da função `TwIntegration.pubSub` para ser executado uma única vez (apague o trecho a seguir após executá-lo e ver a recompensa criada na dashboard) o seguinte trecho de código:

```javascript
// .. código já existente
const apiClient = new ApiClient({ authProvider: authProvider });
this.apiClient = apiClient;
// .. fim de código já existente, linhas inseridas a seguir:
apiClient.channelPoints.createCustomReward(userId, {
    title: "Recompensa teste",
    cost: 1,
    prompt: "Descrição da recompensa (200 caracteres max)",
    isEnabled: true,                
});

// Parâmetros possíveis na criação de nova recompensa:  https://twurple.js.org/reference/api/interfaces/HelixCreateCustomRewardData.html
```

Feito isso, adicione no seu arquivo `.env` as variáveis de ambiente que contém o ID da recompensa criada e adicione na função `TwIntegration.onRedemptionMessage` um teste `if` para ler quando algum usuário comprar o item que você criou. Estes passos são obrigatórios caso vá utilizar a compra de itens via loja da stream. Para recuperar o ID da recompensa, acesse o site: `https://www.instafluff.tv/TwitchCustomRewardID/?channel={SEU CANAL AQUI}`, abra seu chat e faça a compra do item que gostaria de saber o ID da recompensa e veja o resultado neste site.

### Finalizada a integração com a Twitch

Pronto! O bot já está funcionando no seu chat. Com seu serviço rodando (`yarn dev`), teste abrindo seu chat e rodando o comando `!playsound wow`

## Integrando com o Spotify

**IMPORTANTE**: Você precisa ter Spotify Premium. Caso não seja premium, você terá este retorno:<br/>

```json
{
  "error": {
    "status": 403,
    "message": "Player command failed: Premium required",
    "reason": "PREMIUM_REQUIRED"
  }
}
```

Crie ou faça login com sua conta do **Spotify for Developers** no link [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) e então clique em `CREATE AN APP`. Preencha todos os campos e após criado o APP, copie o `CLIENT ID`, clique em  `SHOW CLIENT SECRET` e então copie o Client Secret. Cole essas informações no seu arquivo .env localizado na raiz do projeto. Você também precisa clicar em `EDIT SETTINGS` para definir a `REDIRECT URI` para o nosso localhost. Coloque: `http://localhost:3003/spotify/callback`

Para obter o DEVICE ID ('local' onde suas músicas são escutadas. Pode ser o browser, o aplicativo Spotify, etc) acesse o link: [https://developer.spotify.com/console/get-users-available-devices/](https://developer.spotify.com/console/get-users-available-devices/), clique em `GET TOKEN` e marque a autorização `user-read-playback-state` . Aceite os termos caso ainda não tenha autorizado o Spotify for Developers: Console. Com o OAuth Token gerado, clique em `TRY IT` e veja o resultado no lado direito o resultado. Copie o `id` e cole no seu arquivo .env na variável `SPOTIFY_DEVICE_ID`

Ao final dos passos acima, espera-se que seu arquivo .env também tenha as seguintes variáveis:

```env
#.env
SPOTIFY_DEVICE_ID="cole aqui seu device id"
SPOTIFY_CLIENT_ID="cole aqui seu client id"
SPOTIFY_CLIENT_SECRET="cole aqui seu client secret"
```

O próximo passo é gerar as tokens necessárias para usar a integração com o Spotify. Pra isso você precisa executar nossa aplicação. Abra seu console de comandos e, na raiz do projeto, execute o arquivo `index.ts`. Eu uso o `yarn` então o comando que uso é o `yarn dev`. Se você usa `NPM` obviamente será `npm run dev` e assim sucessivamente. O resultado no seu terminal deve ser o seguinte:

```bash
🚀 Backend started and listening at: http://127.0.0.1:3003
🤖 Bot connected to chat
```

Feito isso, abra seu navegador e acesse [http://127.0.0.1:3003/generate-grant-code](http://127.0.0.1:3003/generate-grant-code) para gerar o `grant code` do Spotify. Ao fazer isso você terá um retorno `A new tab will open with the Spotify grant code`. Será solicitado acesso da aplicação que você criou e, após você permitir, você será redirecionado para `http://127.0.0.1:3003/spotify/callback`, onde você receberá o seu `code` do Spotify. Copie essa informação (disponível no corpo da página ou na URL) e cole o resultado no arquivo `src/jsons/spotify_grant_code.json` , ficando assim:

```json
{
    "code": "cole seu code gerado aqui"
}
```

Agora acesse [http://127.0.0.1:3003/generate-tokens](http://127.0.0.1:3003/generate-tokens) e PRONTO! Você já tá pronto pra usar a integração Spotify!<br/>
**ATENÇÃO** Toda vez que iniciar a live, use o comando `!livestart` para que seja inicializada a playlist corretamente, evitando que músicas solicitadas em datas anteriores apareçam no comando `!songlist`. <br/><br/>

Aproveite! <br/><br/>
##### Made with 💜 by [Jhonatan](https://github.com/jhonatanjunio) and [oNinjaDev Community](https://twitch.tv/oninjadev)