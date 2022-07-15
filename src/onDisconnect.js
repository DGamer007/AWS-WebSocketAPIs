const { deleteConnection, fetchClientsOnly, fetchMachine, apigwManagementApi } = require('./actions');

exports.handler = async (event, context) => {
    try {
        const postDataToConnection = apigwManagementApi(event);

        try {
            const deletedData = (await deleteConnection(event.requestContext.connectionId, true)).Attributes;

            deletedData.name = deletedData.isMachine ? 'Machine' : 'Client';

            try {
                // Fetching clients for The Machine
                const clients = await fetchClientsOnly(deletedData.machineId, !deletedData.isMachine);

                if (deletedData?.isMachine && clients.Count > 0) {
                    // Notify Every Client that Machine is Offline now
                    const responses = clients?.Items?.map(async ({ connectionId }) => {
                        try {
                            await postDataToConnection(connectionId, 'CONTROL', 'MACHINE_OFFLINE');
                        } catch (err) {
                            await deleteConnection(connectionId);
                            throw err;
                        }
                    });

                    await Promise.all(responses);
                } else {
                    if (clients.Count === 0) {
                        // Send Post Signal to Machine to stop Sending Data
                        try {
                            const machine = await fetchMachine(deletedData.machineId);

                            try {
                                await postDataToConnection(machine?.Items?.[0]?.connectionId, 'CONTROL', 'GO_OFFLINE');
                            } catch (err) {
                                await deleteConnection(machine?.Items?.[0]?.connectionId);
                                throw err;
                            }
                        } catch (err) {
                            throw err;
                        }
                    }
                }
            } catch (err) {
                throw err;
            }

        } catch (err) {
            throw err;
        }

        // Success - Connection Ended
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'success' })
        };

    } catch (err) {
        // Failure

        console.error(err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'error', message: err.message || 'Something went wrong' })
        };
    }

};