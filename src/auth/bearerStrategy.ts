import { Operation, NextLink, FetchResult, Observable } from '@apollo/client';
import { sign } from 'jsonwebtoken';

import { IAuthStrategy } from './authStrategy';
import config from '../config';
import { AuthType } from './authEnum';

export class BearerStrategy implements IAuthStrategy {
    public readonly authType: AuthType = AuthType.bearer;

    public handleRequest(operation: Operation, forward: NextLink): Observable<FetchResult> {
        const jwt = sign(
            {
                id: config.systemAccountId,
            },
            config.jwtSecret,
        );
        // add the authorization to the headers
        operation.setContext({
            headers: {
                authorization: `Bearer ${jwt}`,
            },
        });

        return forward(operation);
    }
}
