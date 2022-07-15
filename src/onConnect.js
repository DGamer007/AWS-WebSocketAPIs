const { saveConnection } = require('./actions');
const { validateQueryParams } = require('./utils');


exports.handler = async (event, context) => {
    try {
        // Taking Url Parameters
        const queryParams = event.queryStringParameters;

        if (validateQueryParams(queryParams)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'error', message: 'Connection requires machineId: String and isMachine: Boolean as query parameters' })
            };
        }
        queryParams.isMachine = queryParams.isMachine === 'true';
        queryParams.name = queryParams.isMachine ? 'Machine' : 'Client';


        // Saving The Machine or The Client in DB with its ConnectionId
        await saveConnection(event.requestContext.connectionId, queryParams.machineId, queryParams.isMachine);

        // Success - Connection Established
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