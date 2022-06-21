# 🇧🇷 Informações sobre o banco de dados
Mecanismo de banco de dados: MySQL<br/>
ORM do banco de dados: PrismaJS<br/>

## Tabelas e descrições
### live_playlists
**Descrição**<br/>
Tabela usada para armazenar músicas que os usuários pedem quando sua transmissão está online.<br/>
**Colunas**<br/>
`user_id`: armazena o ID do usuário da tabela de usuários<br/>
`track_id`: ID da faixa do Spotify extraído da solicitação do usuário<br/>
`track_name`: artista + nome da faixa<br/>
`skip_count`: contador de votos para pular a música<br/>
`keep_count`: contador de votos para manter a música<br/>
<br/>

### live_playlist_skip_counts
**Descrição**<br/>
Armazena os votos do usuário relacionados à música atual<br/>
**Colunas**<br/>
`user_id`: armazena o ID do usuário da tabela de usuários<br/>
`live_playlists_id`: ID da música na fila, caso a música já tenha sido alterada e o usuário tente votar<br/>
<br/>

### users
**Descrição**<br/>
Armazena as informações dos usuários.<br/>
**Colunas**<br/>
`username`: o nome de usuário fornecido pelo Twitch quando o usuário digita um comando no chat<br/>
`is_admin`: usado para permitir/negar alguns comandos especiais definidos por você. Um deles criado por padrão é `!livestart`<br/>
`is_subscriber`: informação fornecida pela Twitch quando o usuário digita um comando. Você pode usar isso para criar regras específicas para seus comandos de bate-papo<br/>
<br/>

### user_redemptions
**Descrição**<br/>
Armazena os resgates do usuário. Isso é usado quando você define uma recompensa específica para adicionar uma música à fila do Spotify, por exemplo. Aqui são armazenadas todos os resgates de itens da sua 'loja'.<br/>
**Colunas**<br/>
`redemption_id`: o ID de resgate fornecido pela sua loja de resgate do Twitch. É usado para CUMPRIR ou CANCELAR o resgate do usuário<br/>
`user_id`: armazena o ID do usuário da tabela de usuários<br/>
`reward_id`: o ID do item de recompensa fornecido pela sua loja de resgate do Twitch. É usado para CUMPRIR ou CANCELAR o resgate do usuário também!<br/>
`points_spent`: A quantidade de pontos usada para comprar esta recompensa<br/>

<br/>

# 🇺🇸 Database informations
Database engine: MySQL<br/>
Database ORM: PrismaJS<br/>

## Tables and descriptions
### live_playlists
**Description**<br/>
Table used to store queued tracks from users when your stream is online.<br/>
**Columns**<br/>
`user_id`: stores the user ID from users table<br/>
`track_id`: Spotify track id extracted from the user's request<br/>
`track_name`: artist + track name<br/>
`skip_count`: skip votes to this track<br/>
`keep_count`: keep votes to this track<br/>
<br/>

### live_playlist_skip_counts
**Description**<br/>
Stores the user's votes related to the current playing track<br/>
**Columns**<br/>
`user_id`: stores the user ID from users table<br/>
`live_playlists_id`: queued track ID, just in case the song is already been changed and user tries to vote<br/>
<br/>

### users
**Description**<br/>
Stores the users information<br/>
**Columns**<br/>
`username`: the username provided by Twitch when user types a chat command<br/>
`is_admin`: used to allow/deny some special commands defined by you. One of them created by default is `!livestart`<br/>
`is_subscriber`: information given by Twitch when user types a command. You can use this to create specific rules to your chat commands<br/>
<br/>

### user_redemptions
**Description**<br/>
Stores the user's redemptions. This is used when you set a specific reward to add a song to the Spotify queue for example. Here are stored all the item redemptions from your Twitch 'store'<br/>
**Columns**<br/>
`redemption_id`: the redemption ID provided by your Twitch redemption store. It is used to FULFILL or CANCEL the user's redemption<br/>
`user_id`: stores the user ID from users table<br/>
`reward_id`: the reward item ID provided by your Twitch redemption store. It is used to FULFILL or CANCEL the user's redemption too!<br/>
`points_spent`: The points amount used to buy this reward<br/>

<br/>
