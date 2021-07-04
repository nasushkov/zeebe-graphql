import { ZBClient, Job, CompleteFn, ZBWorker } from 'zeebe-node';

import { red, green } from 'colors';

import { sign } from 'jsonwebtoken';
import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache, gql } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

import { GraphQLError } from 'graphql';
import 'cross-fetch/polyfill';

export class AdapterSetupOptions {
    debug: boolean;
    failOnConnection: boolean;
    graphQLGatewayAddress: string;
    jwtSecret: string;
    maxActiveJobs: number;
    systemAccountId: string;
    taskTimeout: number;
    zeebeGatewayAddress: string;
    zeebeTls: boolean;
    zeebeTaskType: string;
}

export class ZeebeGraphqlAdapter {
    private options: AdapterSetupOptions;
    private zeebeClient: ZBClient;
    private zeebeWorker: ZBWorker<any, any, any>;

    public constructor(options: AdapterSetupOptions) {
        this.options = options;
        this.connectionErrorHandler = this.connectionErrorHandler.bind(this);
    }

    private async graphqlTaskHandler(job: any, complete: CompleteFn<any>): Promise<any> {
        let errText = '';

        if (!job.customHeaders.mutation && !job.customHeaders.query) {
            errText = `GraphQL action is not set for the BPMN process ${job.bpmnProcessId}`;
        } else if (!job.customHeaders.inputVariables) {
            errText = `GraphQL input parameters are not set for the BPMN process ${job.bpmnProcessId}`;
        } else if (!job.variables) {
            errText = `GraphQL input parameter values are not set for the BPMN process ${job.bpmnProcessId}`;
        }

        if (errText) {
            console.error(red(errText));
            job.fail(errText);
            return;
        }

        try {
            if (this.options.debug) {
                console.debug('Setting up Apollo Client for Zeebe adapter...');
            }

            const authMiddlewareLink = new ApolloLink((operation, forward) => {
                const jwt = sign(
                    {
                        id: this.options.systemAccountId,
                        isCustomer: false,
                    },
                    this.options.jwtSecret,
                );
                // add the authorization to the headers
                operation.setContext({
                    headers: {
                        authorization: `Bearer ${jwt}`,
                    },
                });

                return forward(operation);
            });

            const errorAfterwareLink = onError(({ operation, graphQLErrors, networkError }) => {
                let errorStr = `Error while calling ${operation.operationName}. `;

                if (graphQLErrors) {
                    const messages = graphQLErrors.map(
                        (err: GraphQLError) =>
                            `[GraphQL error]: message ${err.message}, locations ${err.locations}, path ${err.path}`,
                    );

                    errorStr += messages.join('. ');
                } else {
                    errorStr += `[Network error]: ${networkError}`;
                }

                console.error(red(errorStr));
                job.fail(errorStr);
            });

            const httpLink = createHttpLink({
                uri: this.options.graphQLGatewayAddress,
            });

            const link = ApolloLink.from([errorAfterwareLink, authMiddlewareLink, httpLink]);

            const graphQLClient = new ApolloClient({
                link,
                cache: new InMemoryCache({ addTypename: false }),
            });

            const variableNames = job.customHeaders.inputVariables.split(',').map((varName: string) => varName.trim());

            const variables = variableNames.reduce(
                (aggr: any, varName: string) => {
                    aggr.input[varName] = job.variables[varName];
                    return aggr;
                },
                { input: {} },
            );

            const actionName = job.customHeaders.mutation ? 'mutation' : 'query';
            const action = job.customHeaders.mutation || job.customHeaders.query;

            if (this.options.debug) {
                console.debug('Apollo Client is set up');
                console.debug(`Calling ${actionName} ${action} with the input ${JSON.stringify(variables)}`);
            }

            const { data } = await graphQLClient[actionName]({
                [actionName]: gql(action),
                fetchPolicy: 'no-cache',
                variables,
            });

            complete.success(data);
        } catch (err) {
            console.error(err.message);
            complete.failure(err.message);
        }
    }

    private async connectionErrorHandler() {
        const errorMessage = `Zeebe broker connection error. Options: ${JSON.stringify(this.options)}`;

        console.error(red(errorMessage));

        if (this.options.failOnConnection) {
            process.kill(process.pid, 'SIGINT');
        }
    }

    private zeebeClientSetup(): ZeebeGraphqlAdapter {
        console.info(green('Setting up Zeebe Client for Zeebe adapter...'));

        this.zeebeClient = new ZBClient(this.options.zeebeGatewayAddress, {
            useTLS: this.options.zeebeTls,
            loglevel: this.options.debug ? 'DEBUG' : 'INFO',
            onReady: () => {
                console.info(green('🚀 Zebee Client is set up'));
            },
            onConnectionError: this.connectionErrorHandler,
        });

        return this;
    }

    private zeebeWorkerSetup(): ZeebeGraphqlAdapter {
        console.info(green('Setting up Zeebe Worker...'));

        this.zeebeWorker = this.zeebeClient.createWorker({
            taskType: 'graphql-worker',
            debug: this.options.debug,
            maxJobsToActivate: this.options.maxActiveJobs,
            failWorkflowOnException: true,
            timeout: this.options.taskTimeout,
            onReady: () => {
                console.info(green('🚀 Zebee Worker is set up'));
            },
            onConnectionError: this.connectionErrorHandler,
            taskHandler: this.graphqlTaskHandler.bind(this),
        });

        return this;
    }

    public setup(): void {
        this.zeebeClientSetup().zeebeWorkerSetup();
    }

    public async shutdown(): Promise<void> {
        console.info(green('Received a shutdown signal. Closing Zeebe client...'));

        if (this.zeebeClient && this.zeebeWorker) {
            await this.zeebeClient.close();
        }

        console.info(green('All Zeebe workers closed'));
    }
}
