'use strict';
const http = require('node:http');
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes, MessageFlags, AttachmentBuilder, ActivityType } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || '';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '';
const PORT = Number(process.env.PORT || 10000);
if (!TOKEN || !GUILD_ID || !STAFF_ROLE_ID) { console.error('Configure TOKEN, GUILD_ID e STAFF_ROLE_ID no Render.'); process.exit(1); }
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const GOLD = 0xD6AC58;
const topics = {
  suporte: { name: 'Suporte Geral', emoji: '🎧', description: 'Dúvidas e ajuda com a cidade' },
  denuncia: { name: 'Denunciar Jogador', emoji: '🚨', description: 'Denúncias com provas' },
  vip: { name: 'Compras e VIP', emoji: '💎', description: 'Dúvidas sobre compras e benefícios' },
  banimento: { name: 'Revisão de Banimento', emoji: '📋', description: 'Solicitar análise de punição' }
};
const topicOf = (owner, type) => `novaera-ticket|${owner}|${type}`;
const parseTicket = ch => { const m = /^novaera-ticket\|(\d+)\|([a-z]+)$/.exec(ch?.topic || ''); return m ? { owner: m[1], type: m[2] } : null; };
const isStaff = i => Boolean(i.member?.roles?.cache?.has(STAFF_ROLE_ID) || i.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) || i.memberPermissions?.has(PermissionsBitField.Flags.Administrator));
const privateReply = (i, content) => i.reply({ content, flags: MessageFlags.Ephemeral });
const asset = name => path.join(__dirname, 'assets', name);
const img = name => new AttachmentBuilder(asset(name), { name });
const shortName = str => str.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 35);

function panelPayload() {
  const embed = new EmbedBuilder().setColor(GOLD)
    .setTitle('🎫 NOVAERA CITY | PAINEL DE ATENDIMENTO')
    .setDescription('**Abra um ticket para falar com nossa equipe.**\nEscolha o tipo de atendimento no menu abaixo.\n\n🔒 Seu atendimento será realizado em um **canal privado**.\n⚠️ Não compartilhe senhas ou informações bancárias.')
    .setImage('attachment://painel-novaera.png')
    .setFooter({ text: 'NOVAERA CITY • CIDADE QUE EVOLUI COM VOCÊ' });
  const select = new StringSelectMenuBuilder().setCustomId('novaera:open').setPlaceholder('🎫 Selecione o tipo de atendimento')
    .addOptions(Object.entries(topics).map(([value, t]) => ({ label: t.name, description: t.description, value, emoji: t.emoji })));
  return { embeds: [embed], files: [img('painel-novaera.png')], components: [new ActionRowBuilder().addComponents(select)] };
}
function ticketEmbed(owner, type, channelId, claimedBy = null) {
  const t = topics[type];
  return new EmbedBuilder().setColor(GOLD).setTitle('🎟️ TICKET ABERTO')
    .setDescription(`Olá, <@${owner}>!\nSeu ticket foi aberto com sucesso. Nossa equipe irá te atender em breve.\n\n**Descreva o que aconteceu e envie provas, se necessário.**`)
    .addFields(
      { name: '🎫 Tipo', value: t?.name || type, inline: true },
      { name: '👤 Aberto por', value: `<@${owner}>`, inline: true },
      { name: '🕒 Horário', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: false },
      { name: '⚙️ Status', value: claimedBy ? `🟢 Em atendimento por <@${claimedBy}>` : '🟡 Aguardando atendimento', inline: false },
      { name: '🔖 Ticket', value: `#${channelId.slice(-6)}`, inline: true }
    )
    .setThumbnail('attachment://logo-ticket.png')
    .setFooter({ text: 'NOVAERA CITY • CIDADE QUE EVOLUI COM VOCÊ' }).setTimestamp();
}
function controls(claimed = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('novaera:claim').setLabel(claimed ? 'Atendimento assumido' : 'Assumir Ticket').setEmoji('🙋').setStyle(ButtonStyle.Primary).setDisabled(claimed),
    new ButtonBuilder().setCustomId('novaera:close').setLabel('Fechar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
  )];
}
async function sendLog(guild, embed, files = []) {
  if (!LOG_CHANNEL_ID) return;
  try { const channel = await guild.channels.fetch(LOG_CHANNEL_ID); if (channel?.isTextBased()) await channel.send({ embeds: [embed], files }); }
  catch (e) { console.error('Erro no canal de logs:', e.message); }
}
async function registerCommands() {
  const commands = [new SlashCommandBuilder().setName('painel').setDescription('Publica o painel profissional de tickets NovaEra City').setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild).toJSON()];
  await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
  console.log('Comando /painel registrado com sucesso.');
}
client.once('clientReady', async () => {
  console.log('Bot conectado:', client.user.tag);
  try { await registerCommands(); } catch (e) { console.error('Erro ao registrar comandos:', e); }
  client.user.setActivity('🎫 Tickets | NovaEra City', { type: ActivityType.Watching });
});
client.on('interactionCreate', async i => {
  if (!i.inGuild() || i.guildId !== GUILD_ID) return;
  try {
    if (i.isChatInputCommand() && i.commandName === 'painel') {
      if (!isStaff(i)) return privateReply(i, '❌ Apenas a equipe pode publicar o painel.');
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await i.channel.send(panelPayload());
      return i.editReply('✅ Painel profissional publicado neste canal!');
    }
    if (i.isStringSelectMenu() && i.customId === 'novaera:open') {
      const type = i.values[0];
      if (!topics[type]) return privateReply(i, '❌ Categoria inválida.');
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const channels = await i.guild.channels.fetch();
      const existing = channels.find(ch => ch && parseTicket(ch)?.owner === i.user.id);
      if (existing) return i.editReply(`⚠️ Você já tem um ticket aberto: ${existing}`);
      const overwrites = [
        { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] },
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.ManageChannels] }
      ];
      const ch = await i.guild.channels.create({ name: `ticket-${shortName(i.user.username)}`, type: ChannelType.GuildText, ...(TICKET_CATEGORY_ID ? { parent: TICKET_CATEGORY_ID } : {}), topic: topicOf(i.user.id, type), permissionOverwrites: overwrites, reason: `Ticket ${topics[type].name} aberto por ${i.user.tag}` });
      await ch.send({ content: `<@${i.user.id}> <@&${STAFF_ROLE_ID}>`, embeds: [ticketEmbed(i.user.id, type, ch.id)], files: [img('logo-ticket.png')], components: controls(), allowedMentions: { users: [i.user.id], roles: [STAFF_ROLE_ID] } });
      await i.editReply(`✅ Seu ticket foi aberto: ${ch}`);
      await sendLog(i.guild, new EmbedBuilder().setColor(GOLD).setTitle('🎫 Ticket aberto').addFields({ name: 'Jogador', value: `<@${i.user.id}>` }, { name: 'Categoria', value: topics[type].name }, { name: 'Canal', value: `${ch}` }).setTimestamp());
      return;
    }
    if (i.isButton() && i.customId === 'novaera:claim') {
      const ticket = parseTicket(i.channel);
      if (!ticket) return privateReply(i, '❌ Este canal não é um ticket válido.');
      if (!isStaff(i)) return privateReply(i, '❌ Apenas a equipe pode assumir tickets.');
      await i.deferUpdate();
      await i.message.edit({ embeds: [ticketEmbed(ticket.owner, ticket.type, i.channel.id, i.user.id)], components: controls(true), files: [img('logo-ticket.png')] });
      await i.channel.send(`👮 Atendimento assumido por <@${i.user.id}>.`);
      return;
    }
    if (i.isButton() && i.customId === 'novaera:close') {
      const ticket = parseTicket(i.channel);
      if (!ticket) return privateReply(i, '❌ Este canal não é um ticket válido.');
      if (i.user.id !== ticket.owner && !isStaff(i)) return privateReply(i, '❌ Você não pode fechar este ticket.');
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const messages = []; let before;
      for (let page = 0; page < 10; page++) {
        const batch = await i.channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
        if (!batch.size) break;
        messages.push(...batch.values()); before = batch.last().id;
        if (batch.size < 100) break;
      }
      messages.reverse();
      const lines = ['NOVAERA CITY | TRANSCRICAO', `Canal: ${i.channel.name}`, `Jogador: ${ticket.owner}`, `Categoria: ${ticket.type}`, `Fechado por: ${i.user.tag}`, `Data: ${new Date().toISOString()}`, ''];
      for (const m of messages) {
        lines.push(`[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '(sem texto)'}`);
        if (m.attachments.size) lines.push('Anexos: ' + [...m.attachments.values()].map(a => a.url).join(', '));
      }
      const transcript = new AttachmentBuilder(Buffer.from(lines.join('\n'), 'utf8'), { name: `ticket-${i.channel.id}.txt` });
      await sendLog(i.guild, new EmbedBuilder().setColor(0xC94A4A).setTitle('🔒 Ticket fechado').addFields({ name: 'Jogador', value: `<@${ticket.owner}>` }, { name: 'Categoria', value: topics[ticket.type]?.name || ticket.type }, { name: 'Fechado por', value: `<@${i.user.id}>` }).setTimestamp(), [transcript]);
      await i.editReply('🔒 Ticket fechado. O canal será excluído.');
      await i.channel.delete(`Ticket fechado por ${i.user.tag}`);
    }
  } catch (e) {
    console.error('ERRO AO EXECUTAR INTERACAO:', e);
    const msg = `❌ Não consegui concluir a ação. Erro: ${e.code || e.message || 'desconhecido'}. Confira os logs do Render.`;
    try { if (i.deferred || i.replied) await i.editReply({ content: msg }); else await privateReply(i, msg); } catch (err) { console.error('Erro ao responder:', err.message); }
  }
});
client.on('error', console.error);
http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('NovaEra City Tickets online'); }).listen(PORT, '0.0.0.0', () => console.log('HTTP na porta', PORT));
client.login(TOKEN).catch(e => { console.error('Erro no login:', e); process.exit(1); });
