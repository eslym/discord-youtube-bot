module.exports = {
    discord: {
        /**
         * Token of the bot
         */
        token: "",

        /**
         * Prompt the invite link of this bot to console
         */
        inviteLink: true,
    },
    youtube: {
        /**
         * Google api key for youtube data api v3
         */
        key: ""
    },
    websub: {
        /**
         *  Base url to generate the callback url for google pubsubhubbub hub
         *  @see https://pubsubhubbub.appspot.com/
         */
        url: "http://localhost",

        /**
         * The ip for webserver to listen to
         */
        host: "127.0.0.1",

        /**
         * The port for webserver to listen to
         */
        port: 8080
    },
    database: {
        driver: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        database: '',
        username: '',
        password: '',
        logging: false,
        sync: true
    }
}