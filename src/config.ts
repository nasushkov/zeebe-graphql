import { AuthType } from './auth';
const nconf = require('nconf');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

nconf
    .env({
        separator: '__',
        whitelist: [
            'AUTH_TYPE',
            'DEBUG',
            'FAIL_ON_CONNECTION',
            'GRAPHQL_HOST',
            'JWT_SECRET',
            'MAX_ACTIVE_JOBS',
            'SYSTEM_ACCOUNT_ID',
            'TASK_TIMEOUT',
            'X_API_KEY',
            'ZEEBE_GATEWAY_ADDRESS',
            'ZEEBE_TASK_TYPE',
            'ZEEBE_TLS',
        ],
    })
    .defaults({
        AUTH_TYPE: AuthType.bearer,
        DEBUG: 'false',
        FAIL_ON_CONNECTION: 'true',
        GRAPHQL_HOST: 'http://localhost:4000/graphql',
        JWT_SECRET: 'fsdDG%^ERgdfgE%Y',
        MAX_ACTIVE_JOBS: 512,
        SYSTEM_ACCOUNT_ID: '4ca30e03-15ce-4a44-9f03-0fba2d76bd33',
        TASK_TIMEOUT: 60000,
        X_API_KEY: '',
        ZEEBE_GATEWAY_ADDRESS: 'localhost:26500',
        ZEEBE_TASK_TYPE: 'graphql-service',
        ZEEBE_TLS: 'false',
    });

const conf = nconf.get();

conf.DEBUG = conf.DEBUG !== 'false';
conf.FAIL_ON_CONNECTION = conf.FAIL_ON_CONNECTION !== 'false';
conf.ZEEBE_TLS = conf.ZEEBE_TLS !== 'false';
conf.IS_PROD = isProd;
conf.IS_TEST = isTest;

export default conf;
