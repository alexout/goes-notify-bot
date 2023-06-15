Telegram Bot for GOES Appointment Notification

## Introduction

The purpose of this project is to create a Telegram bot that will notify the user when an earlier GOES (Global Online Enrollment System) appointment becomes available. The bot will utilize lambda functions as its compute layer and AWS API Gateway for RESTful API interface. The system will be hosted on AWS.

## Use Cases

As a user, I want to be notified when there is an earlier appointment available for my GOES interview, so that I can schedule the interview at an earlier date.
As a user, I want to receive a notification with a link to schedule the appointment as soon as appointmet for earlier date becomes available
As a user, I want to stop receiving notifications
As a user, I want to see next available appointment in my enrollment center
As a user, I want to be able to configure the bot to check for appointments at multiple enrollment centers.

## Sample Conversations

User requests to start appointment notifications
User: /start

Bot: Hi there! I can help you get notified when there is an earlier appointment available for your GOES interview. Please enter your current appointment date in Month name-Day-Year format, for example, "December 10, 2022".

User: December 15, 2022

Bot: Great! Which enrollment center would you like me to check? List of the centers is available here (link). Reply with center ID.

User: 12345

Bot: Searching for available appointments at Albuquerque Enrollment Center. I will notify you as soon as I find an earlier appointment. To turn off notifications, use the /stop command.

User requests to check status of their appointment
User: /status

Bot: Your current appointment is on December 15, 2022 at Albuquerque Enrollment Center.

User requests next available appointment at a specific enrollment center
User: /next_available

Bot: The next available appointment at Albuquerque Enrollment Center is on December 12, 2022.

## Software Architecture

### Backend
AWS Lambda functions will be used as the compute layer.
AWS API Gateway will be used for RESTful API interface to the Telegram Bot.
The lambda function will receive user messages from the API Gateway and respond to them accordingly.
The lambda function will interact with the GOES API to check for available appointments.

### Database

#### Selected database and ORM
 * postgres
 * Slonik

### Considered databases

### Considered ORMs
* sequelize - connection pooling setup in lambda (is complicated)[https://sequelize.org/docs/v6/other-topics/aws-lambda/]
* typeORM - too complicataed for the task
* knexjs

#### NOT using DynamoDB
Original implementation was done with DynamoDB 

table `UserSettings` schema

| Field Name                            | Data Type | Description                               |
| ------------------------------------- | --------- | ----------------------------------------- |
| `userId` (Partition Key)              | String    | The unique identifier for the user.       |
| `locationId`                          | String    | The identifier of the location.           |
| `currentAppointmentDate` (Search key) | String    | The date of the user's current appointment. |

The `userId` is the partition key which is a unique identifier for each user and serves as the primary means of access to their record. This is a critical part of DynamoDB's underlying architecture which facilitates efficient data access patterns. 

The `locationId` and `currentAppointmentDate` are attributes associated with each `userId` that store user-specific settings. `locationId` represents the location identifier where the user plans to have their appointment. `currentAppointmentDate` holds the date of the user's current appointment.

`currentAppointmentDate` is created as a search key. Sicne DynamoDB doesn't support date format, I planned to use
`YYYY-MM-DD` date format which would enable querying users with appointments later then a given date.

Example:

| userId    | locationId | currentAppointmentDate |
|-----------|------------|------------------------|
| 12345678  | 5020       | 2023-07-10             |
| 23456789  | 3060       | 2023-08-15             |
| 34567890  | 5020       | 2023-09-30             |

In this example, `12345678`, `23456789`, and `34567890` are unique identifiers for users. The `locationId` column holds the identifier for each user's enrolment center.

### Frontend
Telegram Bot API will be used for the bot's frontend.
The bot will be implemented in Typescript using the Telegraf library.
The bot will interact with the user through Telegram's chat interface.
The bot will send notifications to the user when an earlier appointment is available.
###  Cloud Architecture
Lambda functions will be deployed in a Virtual Private Cloud (VPC) to increase security and isolation from other AWS services.
An Amazon RDS database will be used to store user data, such as the user's current appointment date and enrollment center.
Amazon SNS will be used to send notifications to users when an earlier appointment is available.


## Conclusion

The GOES Appointment Notification Telegram Bot will allow users to receive notifications when an earlier GOES appointment becomes available. The bot will be implemented using AWS Lambda functions, AWS API Gateway, and Telegram Bot API. The system will be hosted on AWS and will utilize a variety of AWS services to provide a secure and reliable system.