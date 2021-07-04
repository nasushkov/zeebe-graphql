import { AuthType } from './authEnum';
import { BearerStrategy } from './bearerStrategy';
import { XApiKeyStrategy } from './xApiKeyStratagy';

import config from '../config';
import { IAuthStrategy } from './authStrategy';

export const getAuthStategy = (): IAuthStrategy => {
    if (config.AUTH_TYPE === AuthType.bearer) {
        return new BearerStrategy();
    }

    return new XApiKeyStrategy();
};
