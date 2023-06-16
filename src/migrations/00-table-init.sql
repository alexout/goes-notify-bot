CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    userId INT,
    locationId INT,
    currentAppointmentDate DATE,
    CONSTRAINT settings_userId_key UNIQUE (userId)
);

CREATE INDEX idx_userId ON settings (userId);
CREATE INDEX idx_currentAppointmentDate ON settings (currentAppointmentDate);
