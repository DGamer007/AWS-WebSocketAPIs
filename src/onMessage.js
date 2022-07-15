const { fetchSender, fetchClientsOnly, deleteConnection, apigwManagementApi } = require('./actions');

exports.handler = async (event, context) => {
    try {
        const postDataToConnection = apigwManagementApi(event);

        try {
            const { Count, Items: [{ isMachine, machineId }] } = await fetchSender(event.requestContext.connectionId);

            // If there is no sender data in DB then we'll refuse connection
            if (Count === 0) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'error', message: 'Connection does not exist' })
                };
            }

            // If the sender is not a Machine then we won't allow it to send data
            if (!isMachine) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'error', message: 'Clients are not allowed to transmit data' })
                };
            }

            try {
                // Fetching clients for The Machine
                const clients = await fetchClientsOnly(machineId);

                const receivedData = JSON.parse(event.body).data;

                // Send data to every client
                const responses = clients?.Items?.map(async ({ connectionId }) => {
                    try {
                        await postDataToConnection(connectionId, 'DATA', receivedData);
                    } catch (err) {
                        await deleteConnection(connectionId);
                        throw err;
                    }
                });

                await Promise.all(responses);

            } catch (err) {
                throw err;
            }
        } catch (err) {
            throw err;
        }

        // Success - Message sent
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'success' })
        };
    } catch (err) {
        // Failure - Data Transmission Failure

        console.error(err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'error', message: err.message || 'Something went wrong' })
        };
    }
};