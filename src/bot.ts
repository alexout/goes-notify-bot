import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Telegraf } from 'telegraf';
import serverless from 'serverless-http';

const bot = new Telegraf('YOUR_BOT_TOKEN');

bot.start((ctx) => {
  const userName = ctx.message.from.first_name;
  ctx.reply(`Hello, ${userName}! Welcome to the bot.`);
});

export const botHandler = serverless(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const result = await bot.handleUpdate(JSON.parse(event.body));
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  }
);
