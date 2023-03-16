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
User settings will be stored in Dynamo DB

### Frontend
Telegram Bot API will be used for the bot's frontend.
The bot will be implemented in Python using the Telegram Bot API library.
The bot will interact with the user through Telegram's chat interface.
The bot will send notifications to the user when an earlier appointment is available.
###  Cloud Architecture
Lambda functions will be deployed in a Virtual Private Cloud (VPC) to increase security and isolation from other AWS services.
An Amazon RDS database will be used to store user data, such as the user's current appointment date and enrollment center.
Amazon SNS will be used to send notifications to users when an earlier appointment is available.


## Conclusion

The GOES Appointment Notification Telegram Bot will allow users to receive notifications when an earlier GOES appointment becomes available. The bot will be implemented using AWS Lambda functions, AWS API Gateway, and Telegram Bot API. The system will be hosted on AWS and will utilize a variety of AWS services to provide a secure and reliable system.