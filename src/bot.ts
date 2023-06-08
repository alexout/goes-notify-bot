import { Telegraf, Scenes, session } from 'telegraf';
import serverless from 'serverless-http';
import { DynamoDB } from 'aws-sdk';
import moment from 'moment';

// Initialize DynamoDB Document Client
const dynamoDB = new DynamoDB.DocumentClient();

// Interface for storing data in state for configuration wizard
interface ConfigurationWizardState {
    appointmentDate?: string;
  }

// Configure scene
const configureScene = new Scenes.WizardScene<Scenes.WizardContext>('configure',
  async  (ctx: Scenes.WizardContext) => {
    await ctx.reply(
      'Hi there! I can help you get notified when there is an earlier appointment available for your GOES interview. Please enter your current appointment date, for example, "April 20, 2023".'
    );
    return ctx.wizard.next();
  },
  async  (ctx: Scenes.WizardContext) => {
    let appointmentDate: string | undefined;
    if ('text' in ctx.message!) {
        appointmentDate = ctx.message!.text;
    } else {
        // User sent something that is not text - sticker, video or photo
        ctx.reply('Please respond with Date of your appointment');
        return;
    }
    const formattedAppointmentDate = formatDate(appointmentDate);
    if (!formattedAppointmentDate) {
      ctx.reply('Invalid date format. Please enter your current appointment date. I understand many formats, but following is perffered "Month, Day Year", for example, "April 20, 2023".');
      return;
    }

    (ctx.wizard.state as ConfigurationWizardState).appointmentDate = formattedAppointmentDate;

    ctx.reply(
      'Great! Which enrollment center would you like me to check? List of the centers is available here (https://github.com/alexout/goes-notify-bot/blob/main/GOES%20Codes.md). Reply with center ID.'
    );
    return ctx.wizard.next();
  },
  async (ctx: Scenes.WizardContext) => {
    let locationId: string | undefined;
    if ('text' in ctx.message!) {
        locationId = ctx.message!.text;
    } else {
        // User sent something that is not text - sticker, video or photo
        ctx.reply('Please respond with Enrollment Center ID.');
        return;
    }
    if (!locationId || isNaN(Number(locationId))) {
      ctx.reply('Enrollment Center ID must be a number. Please enter it again.');
      return;
    }

    const userId = ctx.from?.id?.toString();

    if (!userId) {
      ctx.reply('User ID not found.');
      return;
    }
    const currentAppointmentDate = (ctx.wizard.state as ConfigurationWizardState).appointmentDate;
    const params = {
      TableName: 'UserSettings',
      Key: { userId },
      UpdateExpression: 'set locationId = :locationId, currentAppointmentDate = :currentAppointmentDate',
      ExpressionAttributeValues: {
        ':locationId': locationId,
        ':currentAppointmentDate': currentAppointmentDate,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    try {
      await dynamoDB.update(params).promise();
      ctx.reply(`All set! I will check for availablity every 5 minutes and will send a message if I find something earlier then ${currentAppointmentDate}.`);
    } catch (err) {
      console.error('DynamoDB error:', err);
      ctx.reply('Failed to save the configuration. Please try again later.');
    }

    ctx.scene.leave();
  }
);


const token: string = process.env.BOT_TOKEN ?? exitWhenEnvVariableNotDefined('BOT_TOKEN');
const bot = new Telegraf<Scenes.WizardContext>(token);
const stage = new Scenes.Stage<Scenes.WizardContext>([configureScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    const userName = ctx.message.from.first_name;
    ctx.reply(`Hello, ${userName}! Welcome to the bot.`);
});

bot.command('configure', (ctx) => ctx.scene.enter('configure'));
  
bot.hears('test', ctx => ctx.reply(`✅ Working fine! \n Chat ID: ${ctx.chat?.id}`));

bot.command('location', async (ctx) => {
  const userId = ctx.from.id.toString();
  const locationId = commandArgs(ctx.message.text);
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
    const dateStr = commandArgs(ctx.message.text);
    const formattedDate = formatDate(dateStr);
    if(!formattedDate) {
      ctx.reply("Please set your current appointment date. Use any format you like. Example usage: /appointment April 20, 2023");
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

function commandArgs(message: string): string {
    const commandRemovedArray= message.split(' ').slice(1);
    const result = commandRemovedArray.join(' ');
    return result;
}

function exitWhenEnvVariableNotDefined(variableName: string): never {
    console.error(`Environment variable ${variableName} is not defined.`);
    process.exit(2);
}

export const botHandler = serverless(bot.webhookCallback("/bot"));
