> :warning: The Cartesi team keeps working internally on the next version of this repository, following its regular development roadmap. Whenever there's a new version ready or important fix, these are published to the public source tree as new releases.

# Running

There are three possible environments to run this Noether node:

- Local private network
- Goerli public network
- Mainnet public network

Instruction for each environment in the following sections.

## Mainnet public network

To run the Noether node on main just execute the command below:

```
docker-compose -p cartesi up
```

This will launch two docker containers: `cartesi_signer` and `cartesi_noether`, and also create a local docker volume called `cartesi_wallet`.

The `signer` container is a ETH proxy responsible for signing ETH transactions and fowarding raw transactions to an light ethereum node. The ethereum node can be any node, either provided privately by the user (like a `geth`), or a service provided by a third-party, like [Infura](https://infura.io), [Cloudflare Ethereum Gateway](https://developers.cloudflare.com/distributed-web/ethereum-gateway), or [Alchemy](https://alchemyapi.io). The default configuration uses Cloudflare, so you don't need any additional step. Configuring the system to use another ethereum node is currently out of scope of this documentation.

The `signer`, when executed for the first time, creates a new ethereum wallet, which is stored in the `wallet` docker volume. This wallet starts with zero ETH balance, and must be funded by the user in a process we call "hiring the node", which means making the node starts working on your behalf. You can stop and restart your node anytime, as long as you don't delete your `wallet` docker volume. If you do, you lose its private key, and the funds in it.

The `noether` implements the logic of the Cartesi Proof of Stake network, which as of now just produces empty blocks paying CTSI rewards for the producers. It keeps polling the blocking until it gets selected to produce a block. For further information check the [pos-dlib repository](https://github.com/cartesi/pos-dlib) documentation.

After you run the node the first step you should see something like the log below:

```
signer_1   |          .
signer_1   |         / \
signer_1   |       /    \
signer_1   | \---/---\  /----\
signer_1   |  \       X       \
signer_1   |   \----/  \---/---\
signer_1   |        \    / CARTESI
signer_1   |         \ /
signer_1   |          '
signer_1   |
signer_1   | Creating new wallet...
signer_1   | Address: 0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9
signer_1   | Setting logging level to INFO
signer_1   | 2020-12-19 22:51:50.790+00:00 | main | INFO  | SignerSubCommand | Version = ethsigner/v20.10.0/linux-x86_64/oracle_openjdk-java-16
signer_1   | 2020-12-19 22:51:52.292+00:00 | main | INFO  | Runner | Server is up, and listening on 8545
noether_1  | [2020-12-19T22:51:56.726Z] INFO: connecting to http://signer:8545...
noether_1  | [2020-12-19T22:51:57.585Z] INFO: connected to network 'homestead' (1)
noether_1  | [2020-12-19T22:51:57.629Z] INFO: starting worker 0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9
noether_1  | [2020-12-19T22:51:57.630Z] DEBUG: PoS(0x8Bd18D3A2B49Db3234a648fC0F7CeDdE2359c2A6)
noether_1  | [2020-12-19T22:51:57.637Z] DEBUG: WorkerManagerAuthManagerImpl(0x832D9f06970ddAc7BA49Be5a2cCad8f89Df74C13)
noether_1  | [2020-12-19T22:51:59.623Z] INFO: 0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9 available for hiring
noether_1  | [2020-12-19T22:51:59.624Z] DEBUG: sleeping for 1 minute
```

The first step you need to do now is to hire your new node, which will make it work on your behalf.
You can use the [Cartesi Explorer](https://explorer.cartesi.io) to do the following tasks:

- Go to https://explorer.cartesi.io and connect to your personal wallet using [Metamask](https://metamask.io).
- Click on [Staking](https://explorer.cartesi.io/staking), then click on `Click to hire node`, fill it up with your node address (which in this example is `0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9`), set the amount of ETH you want to send to your node wallet, and click `Hire Node`. This will send a transaction and make your node "wake up" and starts working on your behalf. The amount of ETH you decide to send depends on how long you expect to run your node. You can expect each block you produce to spend around `156454` gas units, so you can [calculate](https://ethgasstation.info/calculatorTxV.php) how much ETH you will spend based on the network gas price. You should keep an eye in your node funds, and restock it whenever you fill like it.

## Goerli public network

Running on [goerli](https://goerli.net) is very similar to running on `mainnet`, with the following differences:

1) The command is:

```
docker-compose -p cartesi_goerli -f docker-compose-goerli.yml up
```

2) Cloudflare Ethereum gateway does not provide a goerli option, so we use [Infura](https://infura.io). You need to setup an Infura account, and create an environment variable called `PROJECT_ID` with the id of your Infura project.

3) You don't spend real money

4) You need fake CTSI to stake. Ask Cartesi team at discord.

## Local private network

The first step is to run a hardhat node with all the contracts used by noether deployed.
Go to the [pos-dlib](http://github.com/cartesi-corp/pos-dlib/) local project clone and run:

```
npx hardhat node --export ../noether/src/localhost.json
```

This will run a node, deploy all contracts, and write a json file with the ABIs and contracts address to a file inside the noether src code.

Now run noether. You can see options by running `yarn start --help`:

```
% yarn start --help

Start the node.

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
      --url           URL of the Ethereum node[default: "http://localhost:8545"]
      --accountIndex  Account index from server to use              [default: 0]
  -v, --verbose                                       [boolean] [default: false]
```

Try running:

```
yarn start --account-index 1 --verbose
```

This will run noether connecting to hardhat node running at http://localhost:8545 and use account index 1 as the worker address.
We are going to reserve index 0 for the user address.

Now we go back to the `pos` project and run a script to hire the node, by running the following command:

```
npx hardhat --network localhost worker:hire 1
```

At this point the node should be hired, and reading chains to produce blocks.
Next step is to create a chain.
Run the following script:

```
npx hardhat --network localhost pos:create
```

Next step is to fund the RewardManager, by running the following command, replacing `<RewardManagerAddress>` by the address printed in the previous step.

```
npx hardhat --network localhost ctsi:transfer <RewardManagerAddress> 10000000000000000000000
```

Now stake something:

```
npx hardhat --network localhost ctsi:allow 100000000000000000000
npx hardhat --network localhost pos:stake 100000000000000000000
```

# Contributing

Thank you for your interest in Cartesi! Head over to our [Contributing Guidelines](CONTRIBUTING.md) for instructions on how to sign our Contributors Agreement and get started with
Cartesi!

Please note we have a [Code of Conduct](CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

# Authors

* *Danilo Tuler*
* *Gabriel Coutinho*

# License

The repository and all contributions are licensed under
[APACHE 2.0](https://www.apache.org/licenses/LICENSE-2.0). Please review our [LICENSE](LICENSE) file.
