import { Operation, NextLink, FetchResult, Observable } from '@apollo/client';

import { IAuthStrategy } from './authStrategy';
import config from '../config';
import { AuthType } from './authEnum';

export class XApiKeyStrategy implements IAuthStrategy {
    public readonly authType: AuthType = AuthType.xapikey;

    public handleRequest(operation: Operation, forward: NextLink): Observable<FetchResult> {
        operation.setContext({
            headers: {
                'X-API-KEY': config.X_API_KEY,
            },
        });

        return forward(operation);
    }
}
