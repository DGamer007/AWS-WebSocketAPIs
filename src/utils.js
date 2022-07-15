const validateQueryParams = (params) => {
    return !params.hasOwnProperty('machineId') || !params.hasOwnProperty('isMachine') || !['true', 'false'].includes(params.isMachine);
};

module.exports = { validateQueryParams };