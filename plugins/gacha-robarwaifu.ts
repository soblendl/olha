import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['robarwaifu', 'robar'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const args = ctx.ctx.args;
        const userData = ctx.userData;

        if (!ctx.args[0]) {
            await ctx.ctx.reply('✘ Debes proporcionar el ID de la waifu que quieres robar.\n\nEjemplo:\n*#robarwaifu id123*');
            return;
        }

        try {
            const gachaService = ctx.gachaService;
            const waifuId = ctx.args[0];
            const waifu = gachaService.getById(waifuId);

            if (!waifu) {
                await ctx.ctx.reply(`✘ No se encontró ninguna waifu con el ID: *${waifuId}*`);
            return;
            }

            const oldOwner = waifu.user;

            if (!oldOwner || oldOwner === ctx.ctx.sender) {
                await ctx.ctx.reply('✘ Esta waifu no tiene dueño o ya es tuya.');
            return;
            }

            if (oldOwner === global.botOwner) {
                await ctx.ctx.reply(`✘ No puedes robar la waifu de mi owner *${waifu.name}* (ID: ${waifu.id}).`);
            }

            const ownerData = ctx.dbService.getUser(oldOwner);

            if ((ownerData.antirobo || 0) > Date.now()) {
                await ctx.ctx.reply(
                    `🛡 La waifu *${waifu.name}* (ID: ${waifu.id}) tiene AntiRobo activo.\n` +
                    `No puedes robarla hasta: *${new Date(ownerData.antirobo).toLocaleString()}*`
                );
            }

            if (ctx.ctx.sender !== global.botOwner) {
                const cooldowns = ctx.db.cooldowns || {};
                const now = Date.now();
                const cooldownTime = 10 * 60 * 1000;
                const userCooldown = cooldowns[ctx.ctx.sender] || { count: 0, reset: 0 };

                if (now > userCooldown.reset) {
                    userCooldown.count = 0;
                    userCooldown.reset = now + cooldownTime;
                }

                if (userCooldown.count >= 2) {
                    const tiempoRestante = Math.ceil((userCooldown.reset - now) / 60000);
                    await ctx.ctx.reply(
                        `✘ Ya has robado 2 waifus. Espera *${tiempoRestante} minuto(s)* para volver a robar.`
                    );
                }

                userCooldown.count++;
                cooldowns[ctx.ctx.sender] = userCooldown;
                ctx.db.cooldowns = cooldowns;
            }

            gachaService.transferCharacter(waifuId, ctx.ctx.sender);

            if (!userData.gacha.characters) {
                userData.gacha.characters = [];
            }
            userData.gacha.characters.push({
                id: waifu.id,
                name: waifu.name,
                claimedAt: Date.now()
            });

            const ownerCharIndex = ownerData.gacha.characters.findIndex(c => c.id === waifuId);
            if (ownerCharIndex !== -1) {
                ownerData.gacha.characters.splice(ownerCharIndex, 1);
            }

            ctx.dbService.markDirty();

            await ctx.ctx.reply(
                `✧ Has robado a *${waifu.name}* (ID: ${waifu.id}) del usuario *${oldOwner?.split('@')[0] || 'Nadie'}* ✧`
            );

            if (oldOwner && oldOwner !== ctx.ctx.sender && oldOwner !== global.botOwner) {
                try {
                    await ctx.bot.ctx.bot.sock.sendMessage(oldOwner, {
                        text: `✘ El usuario *@${ctx.ctx.sender.split('@')[0]}* ha robado tu waifu *${waifu.name}* (ID: ${waifu.id}).`,
                        mentions: [ctx.ctx.sender]
                    });
                } catch (error: unknown) {
                    console.error('Error enviando notificación al dueño:', (error as Error).message);
                }
            }
        } catch (error: unknown) {
            await ctx.ctx.reply(`✘ Error: ${(error as Error).message}`);
        }
    }
};

export default plugin;
