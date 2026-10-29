'use strict';
const http = require('node:http');
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes, MessageFlags, AttachmentBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || undefined;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || undefined;
const PORT = Number(process.env.PORT || 10000);
if (!TOKEN || !GUILD_ID || !STAFF_ROLE_ID) {
  console.error('Faltam TOKEN, GUILD_ID ou STAFF_ROLE_ID no Environment do Render.');
  process.exit(1);
}
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const topics = {
  suporte: { name: 'Suporte Geral', emoji: '🎧', description: 'Dúvidas e ajuda com a cidade' },
  denuncia: { name: 'Denunciar Jogador', emoji: '🚨', description: 'Denúncias com provas' },
  vip: { name: 'Compras e VIP', emoji: '💎', description: 'Dúvidas sobre compras e benefícios' },
  banimento: { name: 'Revisão de Banimento', emoji: '📋', description: 'Solicitar análise de punição' },
  parceria: { name: 'Parcerias', emoji: '🤝', description: 'Propostas de parceria' }
};
const cmd = new SlashCommandBuilder().setName('painel').setDescription('Publica o painel de tickets da NovaEra City');
const staffPerm = PermissionsBitField.Flags.ManageGuild;
const isStaff = member => member?.roles?.cache?.has(STAFF_ROLE_ID) || member?.permissions?.has(staffPerm);
const ticketTopic = (owner, type) => `novaera-ticket|${owner}|${type}`;
const parseTicket = channel => {
  const match = /^novaera-ticket\|(\d+)\|([a-z]+)$/.exec(channel?.topic || '');
  return match ? { owner: match[1], type: match[2] } : null;
};
const errorText = e => { console.error(e); return 'Não consegui concluir a ação. Verifique as permissões do bot e os IDs configurados.'; };
const replyPrivate = (i, content) => i.reply({ content, flags: MessageFlags.Ephemeral });

function panel() {
  const embed = new EmbedBuilder().setColor(0x148aff)
    .setTitle('🎫 NOVAERA CITY | CENTRAL DE ATENDIMENTO')
    .setDescription('Bem-vindo ao suporte da **NovaEra City**!\n\nSelecione abaixo o motivo do atendimento. Um canal **privado** será criado para você e a equipe.\n\n**Atenção:** não compartilhe senhas ou dados bancários.');
  const menu = new StringSelectMenuBuilder().setCustomId('novaera:open').setPlaceholder('🎫 Selecione o tipo de atendimento')
    .addOptions(Object.entries(topics).map(([value, t]) => ({ label: t.name, description: t.description, value, emoji: t.emoji })));
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}
function ticketControls() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('novaera:claim').setLabel('Assumir atendimento').setEmoji('🙋').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('novaera:close').setLabel('Fechar ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
  )];
}
async function sendLog(guild, embed, files = []) {
  if (!LOG_CHANNEL_ID) return;
  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL_ID);
    if (ch?.isTextBased()) await ch.send({ embeds: [embed], files });
  } catch (e) { console.error('Erro ao enviar log:', e.message); }
}
async function registerCommands() {
  await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: [cmd.toJSON()] });
  console.log('Comando /painel registrado no servidor.');
}
client.once('clientReady', async () => {
  console.log(`Bot conectado: ${client.user.tag}`);
  try { await registerCommands(); } catch (e) { console.error('Falha ao registrar comandos:', e); }
  client.user.setActivity('🎫 Tickets | NovaEra City');
});
client.on('interactionCreate', async i => {
  if (!i.inGuild()) return;
  try {
    if (i.isChatInputCommand() && i.commandName === 'painel') {
      if (!isStaff(i.member)) return replyPrivate(i, '❌ Apenas a equipe pode publicar o painel.');
      await i.channel.send(panel());
      return replyPrivate(i, '✅ Painel de tickets publicado neste canal!');
    }
    if (i.isStringSelectMenu() && i.customId === 'novaera:open') {
      const type = i.values[0];
      if (!topics[type]) return replyPrivate(i, 'Categoria inválida.');
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      // Buscar tickets pelo tópico do canal: continua funcionando após reinícios do Render.
      const channels = await i.guild.channels.fetch();
      const existing = channels.find(ch => ch && parseTicket(ch)?.owner === i.user.id);
      if (existing) return i.editReply(`⚠️ Você já tem um ticket aberto: ${existing}`);
      const permissions = [
        { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] },
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageMessages] }
      ];
      const name = `ticket-${type}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90);
      const channel = await i.guild.channels.create({ name, type: ChannelType.GuildText, parent: TICKET_CATEGORY_ID, topic: ticketTopic(i.user.id, type), permissionOverwrites: permissions, reason: `Ticket de ${i.user.tag}: ${topics[type].name}` });
      const embed = new EmbedBuilder().setColor(0x148aff).setTitle(`${topics[type].emoji} ${topics[type].name} | NovaEra City`)
        .setDescription(`Olá, <@${i.user.id}>! Descreva sua solicitação com detalhes.\n\n<@&${STAFF_ROLE_ID}> irá atender assim que possível.\n\nUse os botões abaixo para assumir ou encerrar o ticket.`)
        .setFooter({ text: `Ticket de ${i.user.username}` }).setTimestamp();
      await channel.send({ content: `<@${i.user.id}> <@&${STAFF_ROLE_ID}>`, embeds: [embed], components: ticketControls(), allowedMentions: { users: [i.user.id], roles: [STAFF_ROLE_ID] } });
      await i.editReply(`✅ Seu ticket foi criado: ${channel}`);
      await sendLog(i.guild, new EmbedBuilder().setColor(0x1ca56b).setTitle('🎫 Ticket aberto').addFields({ name: 'Usuário', value: `<@${i.user.id}>` }, { name: 'Categoria', value: topics[type].name }, { name: 'Canal', value: `${channel}` }).setTimestamp());
    }
    if (i.isButton() && i.customId === 'novaera:claim') {
      const ticket = parseTicket(i.channel);
      if (!ticket) return replyPrivate(i, 'Este canal não é um ticket válido.');
      if (!isStaff(i.member)) return replyPrivate(i, '❌ Apenas a equipe pode assumir tickets.');
      await i.channel.send(`🙋 Atendimento assumido por <@${i.user.id}>.`);
      return replyPrivate(i, '✅ Você assumiu o atendimento.');
    }
    if (i.isButton() && i.customId === 'novaera:close') {
      const ticket = parseTicket(i.channel);
      if (!ticket) return replyPrivate(i, 'Este canal não é um ticket válido.');
      if (i.user.id !== ticket.owner && !isStaff(i.member)) return replyPrivate(i, '❌ Você não pode fechar este ticket.');
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      // Limita a 1000 mensagens para evitar uso excessivo de memória e anexos grandes.
      const messages = [];
      let before;
      for (let page = 0; page < 10; page++) {
        const batch = await i.channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
        if (!batch.size) break;
        messages.push(...batch.values());
        before = batch.last().id;
        if (batch.size < 100) break;
      }
      messages.reverse();
      const transcript = [ `NOVAERA CITY - TRANSCRIÇÃO DE TICKET`, `Canal: ${i.channel.name}`, `Usuário: ${ticket.owner}`, `Categoria: ${ticket.type}`, `Fechado por: ${i.user.tag}`, `Data: ${new Date().toISOString()}`, '' ];
      for (const msg of messages) {
        transcript.push(`[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(sem texto)'}`);
        if (msg.attachments.size) transcript.push('Anexos: ' + [...msg.attachments.values()].map(a => a.url).join(', '));
      }
      const file = new AttachmentBuilder(Buffer.from(transcript.join('\n'), 'utf8'), { name: `ticket-${i.channel.id}.txt` });
      await sendLog(i.guild, new EmbedBuilder().setColor(0xe04444).setTitle('🔒 Ticket fechado').addFields({ name: 'Usuário', value: `<@${ticket.owner}>` }, { name: 'Categoria', value: topics[ticket.type]?.name || ticket.type }, { name: 'Fechado por', value: `<@${i.user.id}>` }, { name: 'Canal', value: i.channel.name }).setTimestamp(), [file]);
      await i.editReply('🔒 Ticket fechado. O canal será excluído.');
      await i.channel.delete(`Ticket fechado por ${i.user.tag}`);
    }
  } catch (e) {
    const message = errorText(e);
    try { if (i.deferred || i.replied) await i.editReply({ content: `❌ ${message}` }); else await replyPrivate(i, `❌ ${message}`); } catch (ignored) { console.error('Falha ao responder interação:', ignored.message); }
  }
});
client.on('error', console.error);
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('NovaEra City Tickets online');
}).listen(PORT, '0.0.0.0', () => console.log(`HTTP na porta ${PORT}`));
client.login(TOKEN).catch(e => { console.error('Falha no login:', e); process.exit(1); });
