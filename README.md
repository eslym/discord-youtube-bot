# Discord Youtube Notification Bot

A bot to receive notification from youtube when there is any update. Notification received via
[Google Pubsubhubbub hub](https://pubsubhubbub.appspot.com/), live-streaming details are fetched from google's youtube
data API v3. All operations can be done by application command.

## Requirements
- Nodejs v16
- Mysql
- Redis server
- any server which can expose port to public

## Features
- Search for a youtube channel (not recommended, the google API quota is finishing fast)
- Subscribe for notification for discord text based channel
- Notify when there is new video published.
- Notify when there is new live-streaming scheduled.
- Notify when a live-streaming is re-scheduled.
- Notify when a live-streaming is almost start.

## Precautions
- Web server need to be configured correctly to receive notification properly.
- Commands are only accessible by server owner by default.
- This program is not designed to share bot account with others.

### Support me
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/L4L56X3F6)