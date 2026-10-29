# 🎫 NovaEra City | Tickets

Bot Discord de tickets separado dos bots de status e verificação da NovaEra City.

## Funções
- Painel profissional com menu de 5 categorias via `/painel`
- Ticket privado para usuário e cargo de atendimento
- Impede mais de um ticket aberto por usuário
- Botões **Assumir atendimento** e **Fechar ticket**
- Logs de abertura e fechamento; transcrição `.txt` das últimas 1000 mensagens ao fechar
- Não depende de banco de dados: usa o tópico do canal para identificar o dono, mesmo após reinício
- Servidor HTTP para hospedar como **Web Service** no Render

## 1. Discord Developer Portal
1. Crie um aplicativo **NovaEra City | Tickets**.
2. Em **Bot**, gere o token. **NUNCA envie ou publique o token**.
3. Em **Installation**, selecione `bot` e `applications.commands` para instalação de guilda.
4. Autorize: View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Manage Channels.
5. Instale no seu servidor Discord.
6. Ative o **Modo desenvolvedor** no Discord (Configurações > Avançado) para copiar IDs.
7. Crie um cargo para a equipe, por exemplo `🎫 Suporte`, e copie o ID. O cargo do bot precisa conseguir ver/gerenciar canais. O bot também precisa da permissão para criar canais dentro da categoria configurada.
8. Opcional: crie uma categoria `🎫 TICKETS` e um canal `📜-logs-tickets`; copie os IDs.

## 2. GitHub
1. Crie um repositório privado chamado `NovaEra_City_Tickets`.
2. Envie `index.js`, `package.json`, `.gitignore`, `.env.example` e `README.md` (os arquivos deste ZIP).
3. **NÃO envie token real nem arquivo `.env` para o GitHub**.

## 3. Render
1. Dashboard > New > **Web Service**.
2. Conecte o GitHub e selecione `NovaEra_City_Tickets`.
3. Language: **Node**. Build Command: `npm install`. Start Command: `npm start`.
4. Em **Environment**, crie:
   - `TOKEN` = token secreto do bot
   - `GUILD_ID` = ID do servidor Discord
   - `STAFF_ROLE_ID` = ID do cargo de atendimento
   - `TICKET_CATEGORY_ID` = ID da categoria de tickets (opcional)
   - `LOG_CHANNEL_ID` = ID do canal de logs (recomendado)
5. Clique em **Deploy Web Service**. No log devem aparecer `Bot conectado:` e `Comando /painel registrado`.
6. Em um canal onde a equipe possa publicar, use `/painel`.

**Importante:** Render Free pode suspender Web Services inativos; nesse caso o bot fica offline até o serviço voltar. Para atendimento contínuo, use um plano que mantenha o serviço ativo. Não rode duas cópias do bot com o mesmo token ao mesmo tempo.

## 4. Permissões
O bot precisa de `Gerenciar canais`, `Ver canais`, `Enviar mensagens`, `Ler histórico de mensagens`, `Inserir links` e `Anexar arquivos`. A pessoa que executa `/painel` precisa do cargo `STAFF_ROLE_ID` ou da permissão `Gerenciar servidor`.

## Observações
- A transcrição é enviada ao canal de logs ao fechar; se `LOG_CHANNEL_ID` estiver vazio ou inacessível, **o histórico não será salvo** antes da exclusão do canal.
- Os anexos são listados como URLs na transcrição; os arquivos originais não são copiados.
- O nome e a categoria do ticket ficam registrados no tópico do canal; não altere esse tópico manualmente.
- Se quiser alterar aparência, comandos, categorias ou integração com loja VIP, edite `index.js`.
