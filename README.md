# NOVAERA CITY | Tickets — 7 cargos

Atualização do bot profissional para **Fundador, Desenvolvedor, Cúpula, Administrador, Suporte, Staff e Ajudante**. Mantém imagens e painel.

## GitHub
Extraia o ZIP e envie **o conteúdo** para a raiz do repositório `NovaEra_City_Tickets`, substituindo `index.js` e os demais arquivos. A pasta `assets` deve ficar ao lado do `index.js`. Não envie token.

## Render > Environment
- `TOKEN`: token do bot (privado).
- `GUILD_ID`: ID do servidor Discord.
- `STAFF_ROLE_IDS`: IDs dos **sete cargos**, separados por vírgula (também aceita espaços). **Não são nomes de cargos**.
- `TICKET_CATEGORY_ID`: opcional, ID da categoria onde criar tickets.
- `LOG_CHANNEL_ID`: opcional, ID do canal de logs.

Remova `STAFF_ROLE_ID` antigo se quiser; `STAFF_ROLE_IDS` tem prioridade. Faça deploy do commit mais recente.

## Uso
Execute `/painel` em um canal onde o bot possa enviar mensagens. Selecione um atendimento para criar um canal privado. Os sete cargos válidos configurados poderão visualizar, assumir e fechar tickets. O autor também pode fechar seu ticket.

## Verificação
Se aparecer `Nenhum cargo de atendimento foi encontrado`, confira os IDs copiados em Configurações do servidor > Cargos. O bot precisa de **Gerenciar canais**, **Ver canais**, **Enviar mensagens**, **Inserir links**, **Anexar arquivos** e **Ler histórico de mensagens**.

**Observação:** as imagens são anexadas pelo bot a partir de `assets/painel-novaera.png` e `assets/logo-ticket.png`.
