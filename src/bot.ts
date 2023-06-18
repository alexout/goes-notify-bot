import { Telegraf, Scenes, session } from 'telegraf';
import serverless from 'serverless-http';
import { createPool, sql } from 'slonik';
import { SecretsManager } from 'aws-sdk';
import moment from 'moment';

// Initialize Secrets Manager client
const secretsManager = new SecretsManager();

// Interface for storing data in state for configuration wizard
interface ConfigurationWizardState {
    appointmentDate: string;
}


async function getPostgresCredentials(): Promise<{ username: string; password: string; host: string; port: number; dbInstanceIdentifier: string }> {
  const secretArn = process.env.POSTGRES_SECRET_ARN ?? exitWhenEnvVariableNotDefined('POSTGRES_SECRET_ARN');
  const secret = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();

  if (!secret.SecretString) {
    throw new Error('Failed to retrieve PostgreSQL secret.');
  }
  const { username, password, host, port, dbInstanceIdentifier } = JSON.parse(secret.SecretString);
  if (!username || !password || !host || !dbInstanceIdentifier || port === undefined) {
    throw new Error('Failed to retrieve necessary Postgres credentials, some variables are not set in the secret');
  }  
  
  return { username, password, host, port, dbInstanceIdentifier };
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
    let locationId: string;
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

    try {
      const { username, password, host, port } = await getPostgresCredentials();
      const encodedPassword = encodeURIComponent(password);
      const connectionString = `postgres://${username}:${encodedPassword}@${host}:${port}/${username}`;
      const pool = await createPool(connectionString, {
        ssl: { rejectUnauthorized: false }, // Adjust SSL options as needed
      });
      await pool.connect( async (connection) => {
        return connection.query(sql.typeAlias('void')`
          INSERT INTO settings (userId, locationId, currentAppointmentDate)
          VALUES (${userId}, ${locationId}, ${currentAppointmentDate})
          ON CONFLICT (userId) DO UPDATE
          SET locationId = excluded.locationId,
              currentAppointmentDate = excluded.currentAppointmentDate
        `);
      });
      ctx.reply(`All set! I will check for availability every 5 minutes and will send a message if I find something earlier than ${currentAppointmentDate}.`);
    } catch (err) {
      console.error('Slonik error:', err);
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
