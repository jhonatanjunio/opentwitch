# OpenTwitch

![Badge](https://img.shields.io/github/license/jhonatanjunio/opentwitch)

## :brazil: O que é a OpenTwitch?

A OpenTwitch é uma aplicação NodeJS desenvolvida [ao vivo na twitch](https://twitch.tv/oninjadev) com o objetivo principal de fazer uma solução colaborativa para streamers da Twitch. Saiba mais sobre toda a estrutura pensada/desenvolvida na [nossa wiki](https://github.com/jhonatanjunio/opentwitch/wiki)

## Dependências

:warning: [Node](https://nodejs.org/en/download/)<br/>
:warning: [Twitch Developers App](https://dev.twitch.tv/console)<br/>
:warning: [Spotify Premium Account](https://www.spotify.com/us/premium/)<br/>
:warning: [Spotify Developers App](https://developer.spotify.com/dashboard/applications)<br/>

## Instalação

[Passo a passo aqui](INSTALL_PTBR.md)<br/>
Após instalado, eu recomendo fortemente que você adicione a pasta `src/jsons` no seu arquivo `.gitignore` pois estes arquivos contém informações sensíveis.

## Recursos

### Integração com o chat da Twitch

Com esse recurso, podemos integrar o bate-papo do seu canal da Twitch com nosso aplicativo para ler **comandos** e **resgates de recompensas** na loja da stream. A biblioteca escolhida foi a [Twurple](twurple.js.org/), que foi confusa de entender à primeira vista, mas funciona bem.

### Integração Spotify

Esta é a cereja do bolo. Com esse recurso, seus espectadores podem adicionar músicas ao dispositivo Spotify fornecido em que você está ouvindo músicas. Os espectadores também podem votar para manter ou pular a música atual. Basicamente, você está passando o controle da playlist de músicas da transmissão ao vivo para o seu público. Fantástico né não?

### Testes via CLI

Você pode testar sua integração diretamente no seu console, simplesmente rodando o comando `test run`+ modulo que gostaria de testar com seus devidos parâmetros. Pra isso é necessário usar algum package manager do NodeJs. Eu particularmente uso o [Yarn](https://yarnpkg.com/), então o comando será `yarn test run song-list 1`, para listar as músicas na playlist atual no ponto de vista do usuário de ID 1. Veja os testes possíveis [neste link](https://github.com/jhonatanjunio/opentwitch/wiki/Tests)

## Problemas conhecidos

- Há muita refatoração a ser feita ainda. Fique a vontade em sugerir melhorias de código e enviar uma nova [pull request](https://github.com/jhonatanjunio/opentwitch/pulls) caso julgue que sua alteração beneficiará o desempenho do código fonte.<br/>
- O código tem os retornos apenas em português. Você pode criar um helper para tradução, lendo a informação do idioma escolhido do arquivo `.env`.<br/>


<br/>
<br/>

Aproveite! <br/><br/>
##### Made with 💜 by [Jhonatan](https://github.com/jhonatanjunio) and [oNinjaDev Community](https://twitch.tv/oninjadev)

<hr/>

## 🇺🇸 What is OpenTwitch?

It is an NodeJS application developed [live at twitch](https://twitch.tv/oninjadev) with the main purpose of make a collaborative sollution for Twitch streamers. Learn more about the whole structure thought/developed at [our wiki](https://github.com/jhonatanjunio/opentwitch/wiki)

## Dependencies

:warning: [Node](https://nodejs.org/en/download/)<br/>
:warning: [Twitch Developers App](https://dev.twitch.tv/console)<br/>
:warning: [Spotify Premium Account](https://www.spotify.com/us/premium/)<br/>
:warning: [Spotify Developers App](https://developer.spotify.com/dashboard/applications)<br/>

## Installation

[Step by step here](INSTALL_EN.md)<br/>
After install, I strongly recommend you to add the `src/jsons` folder to your `.gitignore` because most of its files are used to store sensitive information.

## Resources

### Twitch Chat Integration

With this feature, we are able to integrate your Twitch channel chat with our application in order to read **commands** and **reward redemptions** at your Twitch's stream store. The chosen library was [Twurple](twurple.js.org/), which was messy to understand at the first glance but it works fine.

### Spotify Integration

This is the cake's cherry. With this feature, your viewers can add songs to the provided Spotify device you're listening songs at. Viewers can also vote for keep or skip the current playing song. Basically you are passing the livestream songs playlist control to your audience. Fantastic innit?

### Tests via CLI

You can test your integration directly in your console, simply by running the command `test run`+ module that you would like to test with its proper parameters. For that it is necessary to use some package manager of NodeJs. I particularly use [Yarn](https://yarnpkg.com/), so the command will be `yarn test run song-list 1`, to list the songs in the current playlist from user ID 1 point of view. See the possible tests [at this link](https://github.com/jhonatanjunio/opentwitch/wiki/Tests)

## Known Issues

- There's a lot of refactoring to be made. Feel free to sugest any code improvements and to send a new [pull request](https://github.com/jhonatanjunio/opentwitch/pulls) in case you see your modifications can benefit the source code performance.<br/>
- The code has returns only in Portuguese. You can create a translation helper by reading the chosen language information from the `.env` file.<br/>
  
<br/>
<br/>

## Open source licensing info

1. [TERMS](TERMS.md)
2. [LICENSE](LICENSE)
3. [CFPB Source Code Policy](https://github.com/cfpb/source-code-policy/)

<br/><br/>
Enjoy! <br/><br/>
##### Made with 💜 by [Jhonatan](https://github.com/jhonatanjunio) and [oNinjaDev Community](https://twitch.tv/oninjadev)
