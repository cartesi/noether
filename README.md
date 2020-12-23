> :warning: The Cartesi team keeps working internally on the next version of this repository, following its regular development roadmap. Whenever there's a new version ready or important fix, these are published to the public source tree as new releases.

# Building

To generate a local Docker build, execute the following command:

```
docker build -t cartesi/noether .
```

# Running

There are three possible environments with which to run this Noether node:

- Local private network
- Goerli public network
- Mainnet public network

Instructions for each environment are presented in the following sections.

## Mainnet public network

To run the Noether node on mainnet, just execute the command below:

```
docker run -it --rm --name cartesi_noether -e DIGEST=$(docker images --no-trunc --quiet cartesi/noether:latest) -v cartesi_wallet:/root/.ethereum cartesi/noether:latest --url https://eth.cartesi.io --wallet /root/.ethereum/key --create --verbose
```

This will launch a Docker container named `cartesi_noether`, and also create a local Docker volume called `cartesi_wallet`.

The container connects to an Ethereum node specified with the `--url` parameter, which in the command above is `eth.cartesi.io`, a CNAME for [Cloudflare Ethereum Gateway](https://developers.cloudflare.com/distributed-web/ethereum-gateway). Any Ethereum node can be used by replacing that by a local `geth` URL or another service provided by a third-party, like [Infura](https://infura.io) or [Alchemy](https://alchemyapi.io).

The Noether container, when executed for the first time, creates a new Ethereum wallet, which is stored in an encrypted file inside the `cartesi_wallet` docker volume. A password is asked when the wallet is created and whenever you need to decrypt it. Keep this password safe, otherwise you lose or compromise access to your node's wallet.

The node wallet starts with zero ETH balance, and must be funded by the user in a process called "hiring". In practice, this hiring process corresponds to making the node start working on your behalf. The node will then be capable of signing and sending transactions without prompting you, the user, so it is recommended to avoid overfunding it. You can stop and restart your node anytime, as long as you don't delete your `wallet` docker volume.

Noether implements the logic of the Cartesi Proof of Stake network, which as of now just produces empty blocks paying CTSI rewards for the producers. It keeps polling the PoS contract until it gets selected to produce a block. For further information, check the [pos-dlib repository](https://github.com/cartesi/pos-dlib) documentation.

After you run the node, you should see a log similar to the one below:

```
[2020-12-22T05:58:58.185Z] INFO: connecting to https://eth.cartesi.io...
[2020-12-22T05:58:58.412Z] INFO: connected to network 'homestead' (1)
[2020-12-22T05:58:58.413Z] INFO: loading wallet from /root/.ethereum/key
✔ new password … ***************
[2020-12-22T05:59:05.341Z] INFO: starting worker 0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9
```

Once that is done, you now need to hire your new node, so as to make it work on your behalf.
For that matter, you can use the [Cartesi Explorer](https://explorer.cartesi.io) and perform the following tasks:

- Go to https://explorer.cartesi.io and connect to your personal wallet using [MetaMask](https://metamask.io).
- [Click on "Staking"](https://explorer.cartesi.io/staking), and then on `"Click to hire node"`. Fill in the form with your node address (which in this example is `0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9`), set the amount of ETH you want to send to your node wallet, and click `"Hire Node"`. This will send a transaction and make your node "wake up" and start working on your behalf. The amount of ETH you decide to send depends on how long you expect to keep your node running. Each block you produce can be estimated to spend around `156454` gas units, so it is possible to [calculate](https://ethgasstation.info/calculatorTxV.php) how much ETH you will spend based on the network gas price. You should keep an eye on your node funds, and restock it whenever you deem necessary.

## Goerli public network

Running on [Goerli](https://goerli.net) is very similar to running on `mainnet`, with the following differences:

1) The command is:

```
docker run -it --rm --name cartesi_goerli_noether -v cartesi_goerli_wallet:/root/.ethereum cartesi/noether --url https://goerli.infura.io/v3/<project_id> --wallet /root/.ethereum/key --create --verbose
```

2) Cloudflare Ethereum Gateway does not provide an option for Goerli, so we use [Infura](https://infura.io). You need to setup an Infura account, create an application and use the application URL in the command above.

3) You don't spend real money

4) You need fake CTSI to stake. Ask Cartesi team at [Discord](https://discord.gg/n85Msyp).

## Local private network

The first step is to run a hardhat node with all the contracts used by Noether deployed.
In order to do that, clone the [pos-dlib](http://github.com/cartesi-corp/pos-dlib/) and run:

```
yarn
npx hardhat node --export ../noether/src/localhost.json
```

This will run a node, deploy all contracts, and write a JSON file with the ABIs and contracts addresses to a file inside the noether source code.

Now you can run Noether using yarn. You can see available options by executing `yarn start --help`:

```
% yarn start --help

Start the node.

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
      --url           URL of the Ethereum node[default: "http://localhost:8545"]
      --wallet        Filename of JSON wallet file                      [string]
      --accountIndex  Account index from server to use              [default: 0]
  -c, --create        Create a wallet if it doesn't exist
                                                      [boolean] [default: false]
  -v, --verbose                                       [boolean] [default: false]
```

Try running:

```
yarn start --account-index 1 --verbose
```

This will run Noether connecting to hardhat node running at http://localhost:8545 and using account index 1 as the worker address.
We are reserving index 0 for the user address.

Once the node is running, we can go back to the `pos` project and run the following script to hire the node:

```
npx hardhat --network localhost worker:hire 1
```

At this point, the node should be hired and reading chains to produce blocks.
The next step is to create a chain, which can be done by executing this script:

```
npx hardhat --network localhost pos:create
```

Next step is to fund the RewardManager by running the following command, replacing `<RewardManagerAddress>` by the address printed in the previous step.

```
npx hardhat --network localhost ctsi:transfer <RewardManagerAddress> 10000000000000000000000
```

Finally, you can define an allowance and stake any given amount:

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
