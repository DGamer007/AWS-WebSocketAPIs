const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
const TableName = 'machine_data';

const saveConnection = async (connectionId, machineId, isMachine) => {
    return db.put({
        TableName,
        Item: { connectionId, machineId, isMachine }
    }).promise();
};

const deleteConnection = async (connectionId, returnValues = false) => {
    const params = {
        TableName,
        Key: { connectionId }
    };

    returnValues && (params.ReturnValues = 'ALL_OLD');

    return db.delete(params).promise();

};

const fetchClientsOnly = async (machineId, justCount = false) => {
    const params = {
        TableName,
        ExpressionAttributeValues: {
            ':mid': machineId,
            ':is': false
        },
        FilterExpression: 'machineId = :mid and isMachine = :is',
    };

    justCount ? params.Select = 'COUNT' : params.ProjectionExpression = 'connectionId';

    return db.scan(params).promise();
};

const fetchMachine = async (machineId) => {
    return db.scan({
        TableName,
        ExpressionAttributeValues: {
            ':mid': machineId,
            ':is': true
        },
        FilterExpression: 'machineId = :mid and isMachine = :is',
        ProjectionExpression: 'connectionId'
    }).promise();
};

const fetchSender = async (connectionId) => {
    return db.query({
        TableName,
        Key: { connectionId },
        ExpressionAttributeValues: {
            ':cid': connectionId
        },
        KeyConditionExpression: 'connectionId = :cid'
    }).promise();
};

const apigwManagementApi = (event) => {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`
    });

    return async (ConnectionId, action, payload) => {
        return apigwManagementApi.postToConnection({
            ConnectionId,
            Data: JSON.stringify({
                action,
                [action === 'CONTROL' ? 'status' : 'data']: payload
            })
        }).promise();
    };
};

module.exports = { saveConnection, deleteConnection, fetchClientsOnly, fetchMachine, fetchSender, apigwManagementApi };