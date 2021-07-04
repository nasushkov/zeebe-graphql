import { Operation, NextLink, Observable, FetchResult } from '@apollo/client';
import { AuthType } from './authEnum';

export interface IAuthStrategy {
    handleRequest(operation: Operation, forward: NextLink): Observable<FetchResult>;
    readonly authType: AuthType;
}
