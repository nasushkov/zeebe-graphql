import config from './config';
import { yellow, red } from 'colors';
import { ZeebeGraphqlAdapter, AdapterSetupOptions } from './graphqlAdapter';

(async function () {
    const adapterOptions: AdapterSetupOptions = {
        debug: config.DEBUG,
        failOnConnection: config.FAIL_ON_CONNECTION,
        graphQLGatewayAddress: config.GRAPHQL_HOST,
        maxActiveJobs: config.MAX_ACTIVE_JOBS,
        taskTimeout: config.TASK_TIMEOUT,
        zeebeGatewayAddress: config.ZEEBE_GATEWAY_ADDRESS,
        zeebeTaskType: config.ZEEBE_TASK_TYPE,
        zeebeTls: config.ZEEBE_TLS,
    };

    const adapter = new ZeebeGraphqlAdapter(adapterOptions);

    try {
        adapter.setup();

        const sigs = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

        sigs.forEach((sig: any) => {
            process.on(sig, async () => {
                await adapter.shutdown();
                process.exit(0);
            });
        });
    } catch (err) {
        console.error(red(err.message ? err.message : err));
        adapter
            .shutdown()
            .then(() => {
                process.exit(1);
            })
            .catch((err) => {
                console.warn(yellow('No graceful shutdown due to error'));
                console.error(red(err));
                process.exit(1);
            });
    }
})();
