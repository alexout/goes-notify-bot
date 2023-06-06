import { Telegraf } from 'telegraf';
import serverless from 'serverless-http';

const token: string = process.env.BOT_TOKEN ?? exitWhenEnvVariableNotDefined('BOT_TOKEN');

const bot = new Telegraf(token);

function exitWhenEnvVariableNotDefined(variableName: string): never {
    console.error(`Environment variable ${variableName} is not defined.`);
    process.exit(2);
}

bot.start((ctx) => {
  const userName = ctx.message.from.first_name;
  ctx.reply(`Hello, ${userName}! Welcome to the bot.`);
});

bot.on('message', ctx => ctx.reply(`✅ Working fine! \n Chat ID: ${ctx.chat?.id}`));

export const botHandler = serverless(bot.webhookCallback("/bot"));
