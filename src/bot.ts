import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Telegraf } from 'telegraf';
import serverless from 'serverless-http';

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);

bot.start((ctx) => {
  const userName = ctx.message.from.first_name;
  ctx.reply(`Hello, ${userName}! Welcome to the bot.`);
});

bot.on('message', ctx => ctx.reply('✅ Test passed!'));

export const echobot = serverless(bot.webhookCallback("/bot"));
