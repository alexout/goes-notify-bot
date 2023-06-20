import { sql } from '@pgtyped/runtime';

export interface ISettingsInsertParams {
  userId: string;
  locationId: string;
  currentAppointmentDate: string;
}

export interface ISettingsInsertQuery {
    params: ISettingsInsertParams;
    result: void;
}

export const settingsInsertQuery = sql<ISettingsInsertQuery>`
    INSERT INTO settings (userId, locationId, currentAppointmentDate)
    VALUES ($userId, $locationId, $currentAppointmentDate)
    ON CONFLICT (userId) DO UPDATE
    SET locationId = excluded.locationId,
        currentAppointmentDate = excluded.currentAppointmentDate
`;

export interface ILocation {
    locationId: string;
}

export interface IGetLocationsQuery {
    params: void;
    result: ILocation;
}
  
export const getLocationsQuery = sql<IGetLocationsQuery>`
    SELECT DISTINCT locationId FROM settings
`;
  
export interface IGetUsersWithLaterAppointmentParams {
    locationId: string;
    appointmentDate: string;
}

export interface IUser { 
    userId: string,
    currentAppointmentDate: string,
}

export interface IGetUsersWithLaterAppointmentQuery {
    params: IGetUsersWithLaterAppointmentParams;
    result: IUser;
}
  
export const getUsersWithLaterAppointmentQuery = sql<IGetUsersWithLaterAppointmentQuery>`
    SELECT userId, currentAppointmentDate FROM settings
    WHERE locationId = $locationId AND currentAppointmentDate > $appointmentDate
`;