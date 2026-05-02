export class BaseConfig {
    static ENVIRONMENT = 'dev';

    static SERVER_NAME = 'local';
    static SERVER_PORT = 8080;
    static REMOTE_SERVER_PORT = 3000;
    static FORCE_ENABLE_CONSOLE_LOG = false;

    static RUN_TIME: number = null;
    static DATABASE_MAINTENANCE_MODE: boolean = false;

    static APP_API_SECRET = '';

    static MONGO_CONNECTIONS = {
        APP: { ip: '127.0.0.1:27017', db: 'mahjong', user: '', password: '' },
        AUDIT: { ip: '127.0.0.1:27017', db: 'mahjong', user: '', password: '' },
        LOG: { ip: '127.0.0.1:27017', db: 'mahjong', user: '', password: '' },
        WAREHOUSE: { ip: '127.0.0.1:27017', db: 'mahjong', user: '', password: '' },
    };

    static EMAIL = {
        tag: 'mahjong',
        from: '',
        fromName: '',
        admin: ['']
    }

    static RATE_LIMIT = {
        SKIP_TOKEN: `TOKEN_LIMITER_KQGmnq8vwrKjmx9nDWpQ`,
        ATTEMPTS: 3,
        TIME_LIMIT: 10000
    };

    static APP_INDEX_PAGE = '/dist/index.html';

    /*** ACCESS KEYS ***/
    static MANDRILL_API_KEY = '';
    static MANDRILL = {
        API_URL: 'https://mandrillapp.com/api/1.0'
    };

    static AWS_ACCESS_KEY = '';
    static AWS_ACCESS_SECRET = '';

    static AWS_LAMBDA_ACCESS_KEY = '';
    static AWS_LAMBDA_ACCESS_SECRET = '';

    static SERVERLESS = false;
}