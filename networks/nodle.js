const types = require('./types/nodle-types.json');
const rpc = require('./rpc/nodle-rpc.json');
const metadata = require('./metadata/nodle-metadata.json');

module.exports = {
  blockchain: 'Substrate',
  network: 'Development',
  nodeAddress: process.env.NODE_ADDRESS || 'ws://3.217.156.114:9944',
  ss58Format: 37,
  properties: {
    ss58Format: 37,
    tokenDecimals: 12,
    tokenSymbol: 'NODL',
    poaModule: {
      treasury: '3EnzzoFZSBeDcQ36xu8GpfMw4MU5uDmUatskoAaSg1JBxQPb', // ??
    },
  },
  genesis: '0x490e177c836dd1e4991135c806bbca32de594bb4007c7f3f386d15b1492f638a',
  name: 'Nodle Chain Node',
  specName: 'nodle-chain',
  // Next 2 fields need to change whenever they change on the chain.
  specVersion: 48,
  transactionVersion: 3,
  types,
  rpc,
  metadataRpc: metadata.metadataRpc,
};
