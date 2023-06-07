import { Telegraf, Middleware } from 'telegraf';
import commandParts from 'telegraf-command-parts';
import serverless from 'serverless-http';
import { DynamoDB } from 'aws-sdk';
import moment from 'moment';

const token: string = process.env.BOT_TOKEN ?? exitWhenEnvVariableNotDefined('BOT_TOKEN');

const bot = new Telegraf(token);

// Use commandParts middleware
bot.use(commandParts() as Middleware<any>);

function exitWhenEnvVariableNotDefined(variableName: string): never {
    console.error(`Environment variable ${variableName} is not defined.`);
    process.exit(2);
}

bot.start((ctx) => {
  const userName = ctx.message.from.first_name;
  ctx.reply(`Hello, ${userName}! Welcome to the bot.`);
});

bot.hears('test', ctx => ctx.reply(`✅ Working fine! \n Chat ID: ${ctx.chat?.id}`));

// Initialize DynamoDB Document Client
const dynamoDB = new DynamoDB.DocumentClient();

bot.command('location', async (ctx) => {
  const userId = ctx.from.id.toString();
  const locationId = ctx.state.command.args;
  if(!locationId) {
    ctx.reply("Please specify the location id. List of all location codes: https://github.com/alexout/goes-notify-bot/blob/main/GOES%20Codes.md Example usage: /setlocation 5020");
  } else {
    const params = {
      TableName: 'UserSettings',
      Key: { userId },
      UpdateExpression: 'set locationId = :locationId',
      ExpressionAttributeValues: {
        ':locationId': locationId,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    try {
      await dynamoDB.update(params).promise();
      ctx.reply('Your location has been set successfully!');
    } catch (err) {
      console.error('DynamoDB error:', err);
      ctx.reply('Failed to set your location. Please try again later.');
    }
  }
});

bot.command('appointment', async (ctx) => {
    const userId = ctx.from.id.toString();
    const dateStr = ctx.state.command.args;
  
    const formattedDate = formatDate(dateStr);
    
    if(!formattedDate) {
      ctx.reply("Please set your current appointment date. Use any format you like Example usage: /setappointment April 20, 2023");
    } else {
      const params = {
        TableName: 'UserSettings',
        Key: { userId },
        UpdateExpression: 'set currentAppointmentDate = :currentAppointmentDate',
        ExpressionAttributeValues: {
          ':currentAppointmentDate': formattedDate,
        },
        ReturnValues: 'UPDATED_NEW',
      };
  
      try {
        await dynamoDB.update(params).promise();
        ctx.reply('Your appointment date has been set successfully!');
      } catch (err) {
        console.error('DynamoDB error:', err);
        ctx.reply('Failed to set your appointment date. Please try again later.');
      }
    }
});

function formatDate(date) {
    const formats = [
      moment.ISO_8601,
      'MM-DD-YYYY',
      'MM/DD/YYYY',
      'DD-MM-YYYY',
      'DD/MM/YYYY',
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'MMMM D, YYYY',
      'D MMMM, YYYY',
    ];
  
    for (let format of formats) {
      const momentDate = moment(date, format, true);
      if (momentDate.isValid()) {
        return momentDate.format('YYYY-MM-DD');
      }
    }
  
    return null;
  }

export const botHandler = serverless(bot.webhookCallback("/bot"));
