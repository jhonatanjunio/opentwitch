# 🇧🇷 Testes implementados
Os testes disponíveis são equivalentes aos arquivos listados na pasta `src/tests/modules`. O nome do comando é exatamente o nome do arquivo! Para executar o teste, você precisa de um Node package manager (exemplos: npm, yarn ...) e ao acessar o seu console digite, por exemplo, `yarn test run song-list 1`.

## add-song
### Descrição
Teste para adicionar músicas a fila atual. É um bom teste para se fazer antes de iniciar a live. Este teste contempla todas as validações que o espectador deve respeitar.
### Parâmetros
`userId`: ID do usuário que é utilizado para futuras implementações. <br/>
`userName`: Nome do usuário utilizado para 'responder' ao comando enviado. <br/>
`trackId`: ID da música do Spotify. Enviar o comando sem este parâmetro irá informar os formatos de ID aceitos.<br/>

## song-list
Teste para listar as próximas músicas na fila. Atualmente não lista a música que está sendo tocada no momento (nos testes apenas).
### Parâmetros
`userId`: ID do usuário que é utilizado para futuras implementações, como 'posição da próxima musica solicitada pelo usuário que chamou este comando'. <br/>

# 🇺🇸 Implemented tests
The tests available are equivalent to the files listed in the `src/tests/modules` folder. The command name is exactly the file name! To run the test, you need a Node package manager (examples: npm, yarn...) and when accessing your console type, for example, `yarn test run song-list 1`.

## add-song
### Description
Test to add songs to the current queue. It's a good test to do before starting the livestream. This test includes all the validations that the spectator must fulfill.
### Parameters
`userId`: User ID that is used for future implementations. <br/>
`userName`: Username used to 'respond' to the command sent. <br/>
`trackId`: Spotify song ID. Sending the command without this parameter will inform the accepted ID formats.<br/>

## song-list
Test to list the next songs in the queue. It currently does not list the song currently being played (in testing only).
### Parameters
`userId`: User ID that is used for future implementations, like 'position of next song requested by user who called this command'. <br/>