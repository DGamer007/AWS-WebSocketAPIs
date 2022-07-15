const { apigwManagementApi, fetchSender, fetchClientsOnly, deleteConnection, fetchMachine } = require('./actions');

exports.handler = async (event, context) => {
    try {
        const postDataToConnection = apigwManagementApi(event);

        const { Count, Items } = await fetchSender(event.requestContext.connectionId);

        // If there is no sender data in DB then we'll refuse connection
        if (Count < 1) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'error', message: 'Connection does not exist' })
            };
        }

        const { machineId, isMachine } = Items[0];

        if (isMachine) {
            try {
                // Fetching Clients for The Machine
                const clients = await fetchClientsOnly(machineId);

                if (clients.Count > 0) {
                    try {
                        // Send Control Signal to The Machine - GO_ONLINE
                        await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'GO_ONLINE');
                    } catch (err) {
                        // If we fail to send Control Signal then we'll remove The Machine from DB                        
                        await deleteConnection(event.requestContext.connectionId);
                        throw err;
                    }

                    try {
                        for (const { connectionId } of clients.Items) {
                            try {
                                await postDataToConnection(connectionId, 'CONTROL', 'MACHINE_ONLINE');
                            } catch (err) {
                                await deleteConnection(connectionId);
                                clients.Count -= 1;

                                if (clients.Count === 0) {
                                    try {
                                        // Send Control Signal to The Machine - GO_OFFLINE
                                        await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'GO_OFFLINE');
                                    } catch (err2) {
                                        await deleteConnection(event.requestContext.connectionId);
                                        throw err2;
                                    }
                                }
                                throw err;
                            }
                        }
                    } catch (err) {
                        throw err;
                    }
                } else {
                    try {
                        // Send Control Signal to The Machine - GO_OFFLINE
                        await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'GO_OFFLINE');
                    } catch (err) {
                        await deleteConnection(event.requestContext.connectionId);
                        throw err;
                    }
                }
            } catch (err) {
                throw err;
            }
        } else {
            try {
                const machineConnectionId = (await fetchMachine(machineId))?.Items?.[0]?.connectionId;

                if (!machineConnectionId) {
                    try {
                        // Send Control Signal to The Client - MACHINE_OFFLINE
                        await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'MACHINE_OFFLINE');
                    } catch (err) {
                        await deleteConnection(event.requestContext.connectionId);
                        throw err;
                    }
                } else {
                    try {
                        const clients = await fetchClientsOnly(machineId, true);


                        if (clients.Count > 1) {
                            try {
                                // Send Control Signal to The Client - MACHINE_ONLINE
                                await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'MACHINE_ONLINE');
                            } catch (err) {
                                await deleteConnection(event.requestContext.connectionId);
                                throw err;
                            }
                        } else {
                            try {
                                try {
                                    // Send Control Signal to The Machine - GO_ONLINE
                                    await postDataToConnection(machineConnectionId, 'CONTROL', 'GO_ONLINE');
                                } catch (err) {
                                    await deleteConnection(machineConnectionId);

                                    try {
                                        // Send Control Signal to The Client - MACHINE_OFFLINE
                                        await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'MACHINE_OFFLINE');
                                    } catch (err2) {
                                        await deleteConnection(event.requestContext.connectionId);
                                        throw err2;
                                    }
                                    throw err;
                                }

                                // Send Control Signal to The Machine - MACHINE_ONLINE
                                await postDataToConnection(event.requestContext.connectionId, 'CONTROL', 'MACHINE_ONLINE');
                            } catch (err) {
                                await deleteConnection(event.requestContext.connectionId);
                                throw err;
                            }
                        }
                    } catch (err) {
                        throw err;
                    }

                }
            } catch (err) {
                throw err;
            }
        }

        // Success
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'success' })
        };
    } catch (err) {
        // Failure - Connection Failure

        console.error(err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'error', message: err.message || 'Something went wrong' })
        };
    }
};