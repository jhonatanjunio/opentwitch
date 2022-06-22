## 🇧🇷 Bem vindo a wiki do **opentwitch**!
Nesta wiki você entenderá a estrutura do projeto, para que, caso opte por colaborar, saiba como tudo foi pensado.

## O que é OpenTwitch?
É uma aplicação NodeJS desenvolvida [ao vivo na twitch](https://twitch.tv/oninjadev) com o objetivo principal de fazer uma solução colaborativa para streamers da Twitch.
## Recursos
### Integração com o chat da Twitch
Com esse recurso, podemos integrar o bate-papo do seu canal da Twitch com nosso aplicativo para ler **comandos** e **resgates de recompensas** na loja da stream. A biblioteca escolhida foi a [Twurple](twurple.js.org/), que foi confusa de entender à primeira vista, mas funciona bem.
### Integração Spotify
Esta é a cereja do bolo. Com esse recurso, seus espectadores podem adicionar músicas ao dispositivo Spotify fornecido em que você está ouvindo músicas. Os espectadores também podem votar para manter ou pular a música atual. Basicamente, você está passando o controle da playlist de músicas da transmissão ao vivo para o seu público. Fantástico né não?
### Testes via CLI
Você pode testar sua integração diretamente no seu console, simplesmente rodando o comando `test run`+ modulo que gostaria de testar com seus devidos parâmetros. Pra isso é necessário usar algum package manager do NodeJs. Eu particularmente uso o [Yarn](https://yarnpkg.com/), então o comando será `yarn test run song-list 1`, para listar as músicas na playlist atual no ponto de vista do usuário de ID 1. Veja os testes possíveis [neste link](https://github.com/jhonatanjunio/opentwitch/wiki/Tests)
<br/>

## 🇺🇸 Welcome to the **opentwitch** wiki!
In this wiki you will understand the structure of the project, so that if you choose to collaborate, you will know how everything was thought of.

## What is OpenTwitch?
It is an NodeJS application developed [live at twitch](https://twitch.tv/oninjadev) with the main purpose of make a collaborative sollution for Twitch streamers.
## Resources
### Twitch Chat Integration
With this feature, we are able to integrate your Twitch channel chat with our application in order to read **commands** and **reward redemptions** at your Twitch's stream store. The chosen library was [Twurple](twurple.js.org/), which was messy to understand at the first glance but it works fine.
### Spotify Integration
This is the cake's cherry. With this feature, your viewers can add songs to the provided Spotify device you're listening songs at. Viewers can also vote for keep or skip the current playing song. Basically you are passing the livestream songs playlist control to your audience. Fantastic innit?
### Tests via CLI
You can test your integration directly in your console, simply by running the command `test run`+ module that you would like to test with its proper parameters. For that it is necessary to use some package manager of NodeJs. I particularly use [Yarn](https://yarnpkg.com/), so the command will be `yarn test run song-list 1`, to list the songs in the current playlist from user ID 1 point of view. See the possible tests [at this link](https://github.com/jhonatanjunio/opentwitch/wiki/Tests)
<br/>