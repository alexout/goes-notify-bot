# goes-notify-bot

This bot send notifications about new dates for appoitments for many of CBP's Trusted Traveler Programs, including Global Entry, NEXUS, SENTRI, US/Mexico FAST, and US/Canada FAST. Users don't need to provide a login, it will simply check the available dates against your current interview date, then notify you if a better date can be locked in.

Inspired by https://github.com/Drewster727/goes-notify


# Deployment

1. Get web token from @BotFather
2. Set environment variable
```

```
3. Deploy the endpoint
```
sls deploy
```
4. get URL from serverless output. i.e https://otjvo96r9c.execute-api.us-east-1.amazonaws.com/dev/handler
5. set webhook for your bot, use your URL from step 4.
```
curl --request POST --url https://api.telegram.org/bot$BOT_TOKEN/setWebhook --header 'content-type: application/json' --data '{"url": https://otjvo96r9c.execute-api.us-east-1.amazonaws.com/dev/handler}'
```
If you have done it correctly, you will see output like one below:
```
{"ok":true,"result":true,"description":"Webhook was set"}
```

## License
MIT

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
