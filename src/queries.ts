// queries.ts

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
