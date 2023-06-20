import axios from 'axios';
import moment from 'moment';
import { Telegraf } from 'telegraf';
import { getConnectedClient } from './db';
import { getLocationsQuery, getUsersWithLaterAppointmentQuery, IUser, ILocation } from './queries';
import { getEnvVariableValueOrExit } from './helpers';

const token: string = getEnvVariableValueOrExit('BOT_TOKEN');
const bot = new Telegraf(token);

interface Appointment {
    startTimestamp: string;
    active: boolean;
    [key: string]: any; // Optional: Allow any additional properties
  }

async function getDates(locationId: string): Promise<moment.Moment[]> {
  const response = await axios.get(`https://api.example.com/locations/${locationId}/dates`);
  const appointments: Appointment = response.data
  return appointments
            .filter(appointment => appointment.active)
            .map(appointment => moment(appointment.startTimestamp, 'YYYY-MM-DDTHH:mm'));
}

function formatMessage(dates: moment.Moment[]){
  const formattedDates = dates.map(date => (`\u2022 ${date.format('dddd, MMMM DD @ hh:mm a')}`)); // Unicode character for bullet point (•)
  const msg = `New Global Entry appointments available on the following dates:\n${formattedDates.join('\n')}`;
  return msg;  
}

async function notifyUsers(locationId: string, availableDates: moment.Moment[]) {
  const client = await getConnectedClient();
  const users: IUser[] = await getUsersWithLaterAppointmentQuery.run({ locationId, appointmentDate: availableDates[0].format('YYYY-MM-DD') }, client);
  await client.end();

  for (let user of users) {
    const userInterestedDates = availableDates.filter(date => date.isBefore(moment(user.currentAppointmentDate)));
    if (userInterestedDates.length > 0) {
      const msg = formatMessage(userInterestedDates);
      await bot.telegram.sendMessage(user.userId, msg);
    }
  }
}

export const checkAppointments = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    const client = await getConnectedClient();
    const locations: ILocation[] = await getLocationsQuery.run(undefined, client);
    await client.end();

    for (let location of locations) {
      const earliestAvailableDates = await getDates(location.locationId);
      if (earliestAvailableDates.length > 0) {
        await notifyUsers(location.locationId, earliestAvailableDates);
      }
    }
    
    return lambdaResponse(200, 'User Notification Sent', event);
  } catch (error) {
    console.error("Error occurred while checking appointments:", error);
    return lambdaResponse(500, error.message, event);
  }
};

function lambdaResponse(statusCode: number, message: string, event: LambdaEvent): LambdaResponse {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
      input: event,
    }),
  };
}

interface LambdaEvent {
  [key: string]: any;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}
