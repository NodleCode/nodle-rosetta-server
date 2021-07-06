const types = require('../nodle-types.json');
const rpc = require('../nodle-rpc.json');

module.exports = {
  blockchain: 'Nodle',
  network: 'mainnet',
  nodeAddress: 'ws://3.217.156.114:9944', // This expects you have a synced local node running!
  ss58Format: 37,
  properties: {
    ss58Format: 37,
    tokenDecimals: 4,
    tokenSymbol: 'NODL',
    poaModule: {
      treasury: '3EnzzoFZSBeDcQ36xu8GpfMw4MU5uDmUatskoAaSg1JBxQPb', // ??
    },
  },
  genesis: '0xf73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a9', // ??
  name: 'mainnet',
  specName: 'dock-main-runtime',
  // Next 2 fields need to change whenever they change on the chain.
  specVersion: 19,
  transactionVersion: 1,
  types,
  rpc,
};
