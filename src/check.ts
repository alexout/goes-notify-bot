import axios from 'axios';
import moment from 'moment';
import { Telegraf } from 'telegraf';

const token: string = process.env.BOT_TOKEN ?? exitWhenEnvVariableNotDefined('BOT_TOKEN');
const chatID: number = parseInt(process.env.CHAT_ID ?? exitWhenEnvVariableNotDefined('CHAT_ID'), 10);

const bot = new Telegraf(token);

function exitWhenEnvVariableNotDefined(variableName: string): never {
    console.error(`Environment variable ${variableName} is not defined.`);
    process.exit(2);
}

// Define your event shape according to your usage
interface LambdaEvent {
[key: string]: any;
}

interface LambdaResponse {
    statusCode: number;
    body: string;
}

async function getDates(settings: any) {
    const dates: string[] = [];
    try {
        const goesURL: string = `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=3&locationId=${settings.enrollment_location_id}&minimum=1`
        const { data } = await axios.get(goesURL);

        // Parse the json
        if (!data) {
            console.info('No tests available.');
            return;
        }

        const currentApt = moment(settings.current_interview_date_str, 'MMMM DD, YYYY');


        for (let o of data) {
            if (o.active) {
                const dtp = moment(o.startTimestamp, 'YYYY-MM-DDTHH:mm');

                if (currentApt.isAfter(dtp)) {
                    dates.push(dtp.format('dddd, MMMM DD @ hh:mm a'));
                }
            }
        }
        console.log(dates);
        return dates;
    } catch (error) {
        console.error("Something went wrong when trying to obtain the openings");
        return dates;
    }
    //const msg = `Found new appointment(s) in location ${settings.enrollment_location_id} on ${dates[0]} (current is on ${currentApt.format('MMMM DD, YYYY @ hh:mm a')}!)`;
    // notifyUser(dates, currentApt, settings, settings.use_gmail);
}

export const checkAppointments = async (event: LambdaEvent): Promise<LambdaResponse> => {
    await bot.telegram.sendMessage(chatID, 'Hello, World!');  // replace 'CHAT_ID' with your Telegram chat id
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Message sent',
            input: event,
        }),
    };
};