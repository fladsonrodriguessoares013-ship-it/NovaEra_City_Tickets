# NOVAERA CITY | TICKETS PROFISSIONAL

Bot separado de tickets Discord, com painel preto/dourado e imagens enviadas pelo usuário.

## GitHub (atualizar o repositório existente)

1. Extraia este ZIP.
2. Entre no repositório `NovaEra_City_Tickets`.
3. Envie **index.js**, **package.json**, **README.md**, **.gitignore**, **.env.example** e a pasta **assets** na raiz do repositório. Substitua os arquivos antigos.
4. Não envie token, `.env` ou `node_modules`.

## Render

Mantenha o mesmo serviço Render, sem criar outro.
- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: vazio
- Environment:
  - `TOKEN`: token do bot de tickets (privado)
  - `GUILD_ID`: `1523378549187285124`
  - `STAFF_ROLE_ID`: ID de um cargo **que realmente existe** no servidor e que será a equipe de atendimento.
  - `TICKET_CATEGORY_ID`: opcional, ID da categoria onde os canais serão criados.
  - `LOG_CHANNEL_ID`: opcional, ID do canal para registros e transcrições.
  - `PORT`: Render define automaticamente; pode deixar sem configurar.

Após enviar arquivos ao GitHub, faça **Manual Deploy > Deploy latest commit**, se não houver deploy automático.

## Discord

- Dê ao bot as permissões **Ver canais, Enviar mensagens, Inserir links, Anexar arquivos, Ler histórico de mensagens e Gerenciar canais**.
- Confira as permissões no canal onde executará `/painel`.
- Use `/painel` como administrador ou membro com **Gerenciar servidor**.
- O painel abre quatro categorias no menu; o ticket aparece em canal privado com cartão personalizado e botões **Assumir Ticket** / **Fechar Ticket**.
- `STAFF_ROLE_ID` deve ser um cargo real; ID incorreto pode gerar `DiscordAPIError[10011]: Unknown Role` ou `Missing Access`.
- Se aparecer erro no Discord, confira os logs do Render. O bot mostra o código de erro quando disponível.

## Observações

A imagem do painel é a imagem fornecida, com elementos estáticos. Jogador, categoria, data e status no cartão de ticket são atualizados por embed do Discord. As transcrições são enviadas ao canal de logs somente se `LOG_CHANNEL_ID` estiver configurado. A criação de ticket não depende de banco de dados: tickets abertos são encontrados pelo tópico do canal.
