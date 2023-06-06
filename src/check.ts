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

interface Settings {
    current_interview_date_str: string;
    enrollment_location_id: string;
}

const settings: Settings = {
    current_interview_date_str: "August 31, 2023",
    enrollment_location_id: "5020"
}

async function getDates(settings: Settings): Promise<string[]> {
    const dates: string[] = [];
    try {
        const goesURL: string = `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=3&locationId=${settings.enrollment_location_id}&minimum=1`
        const { data } = await axios.get(goesURL);

        // Parse the json
        if (!data) {
            console.info('No tests available.');
            return dates;
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

function lambdaResponse(statusCode: number, message: string, event: LambdaEvent): LambdaResponse {
    return {
        statusCode,
        body: JSON.stringify({
            message,
            input: event,
        }),
    };
}

function formatMessage(dates: string[]){
    const formattedDates = dates.map(date => {
        const formattedDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');
        return `\u2022 ${formattedDate}`; // Unicode character for bullet point (•)
    });
      
    // Generate the message text
    const msg = `New Global Entry appointments available on the following dates:\n${formattedDates.join('\n')}`;
    return msg;  
}

export const checkAppointments = async (event: LambdaEvent): Promise<LambdaResponse> => {
    const dates = await getDates(settings);
    if (!dates.length) {
        return lambdaResponse(200, 'No new dates', event);
    }
    await bot.telegram.sendMessage(chatID, formatMessage(dates));
    return lambdaResponse(200, 'User Notification Sent', event);
};