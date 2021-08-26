# Nodle Rosetta Server

## Installation

* copy `.npmrc.example` to `.npmrc` and replace `TOKEN` with correct Github Token
* copy `.env.example` to `.env`
* run `npm i`

## Run server

Execute

```
npm run run:server
```

## Rosetta-cli
from './rosetta-cli' run
```
./rosetta-cli "command" -configuration-file ./config.json
```
Where 'command' is one of rosetta-cli available commands:
* check:construction
* check:data
* view:balance           
* view:block
* view:networks

More info at https://github.com/coinbase/rosetta-cli#usage

## Manual Testing (Transaction broadcasting)
To broadcast a transaction, make POST requests to following endpoints:
1. construction/metadata - to get user's relevant metadata
2. construction/payloads - make a pyalod with retrieved metadata
3. construction/combine - insert from 'construction/payloads' response:
  * unsigned_transaction
  * "hex_bytes" from "payloads[0]" - this bytes goes to signatures[0].signing_payload.hex_bytes
  * make a signature for this bytes (0x`${bytes}`) (here for example: https://nodleprotocol.io/?rpc=wss%3A%2F%2F3.217.156.114#/signing )
  * resulting signature pass to signatures[0].hex_bytes (without 0х)
  * execute 'construction/combine'
4. construction/submit - submit signed transaction from 'construction/combine'
