> :warning: The Cartesi team keeps working internally on the next version of this repository, following its regular development roadmap. Whenever there's a new version ready or important fix, these are published to the public source tree as new releases.

# Running

There are three possible environments to run this Noether node:

- Local private network
- Goerli public network
- Mainnet public network

Instruction for each environment in the following sections.

## Mainnet public network

To run the Noether node on mainnet just execute the command below:

```
docker run -it --rm --name cartesi_noether -v cartesi_wallet:/root/.ethereum cartesi/noether:wallet --url https://eth.cartesi.io --wallet /root/.ethereum/key --create --verbose
```

This will launch a docker container named `cartesi_noether`, and also create a local docker volume called `cartesi_wallet`.

The container connects to an ethereum node, which in the command above is [Cloudflare Ethereum Gateway](https://developers.cloudflare.com/distributed-web/ethereum-gateway). Any ethereum node can be used by replacing that by a local `geth` or another service provided by a third-party, like [Infura](https://infura.io) or [Alchemy](https://alchemyapi.io).

The noether container, when executed for the first time, creates a new ethereum wallet, which is stored in an encrypted file inside the `cartesi_wallet` docker volume. A password is asked when wallet is created and whenever you need to decrypt it. This wallet starts with zero ETH balance, and must be funded by the user in a process we call "hiring the node", which means making the node starts working on your behalf. You can stop and restart your node anytime, as long as you don't delete your `wallet` docker volume. If you do, you lose its private key, and the funds in it.

The `noether` implements the logic of the Cartesi Proof of Stake network, which as of now just produces empty blocks paying CTSI rewards for the producers. It keeps polling the blocking until it gets selected to produce a block. For further information check the [pos-dlib repository](https://github.com/cartesi/pos-dlib) documentation.

After you run the node the first step you should see something like the log below:

```
[2020-12-22T05:58:58.185Z] INFO: connecting to https://eth.cartesi.io...
[2020-12-22T05:58:58.412Z] INFO: connected to network 'homestead' (1)
[2020-12-22T05:58:58.413Z] INFO: loading wallet from /root/.ethereum/key
✔ new password … ***************
[2020-12-22T05:59:05.341Z] INFO: starting worker 0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9
```

The first step you need to do now is to hire your new node, which will make it work on your behalf.
You can use the [Cartesi Explorer](https://explorer.cartesi.io) to do the following tasks:

- Go to https://explorer.cartesi.io and connect to your personal wallet using [Metamask](https://metamask.io).
- Click on [Staking](https://explorer.cartesi.io/staking), then click on `Click to hire node`, fill it up with your node address (which in this example is `0x8B40e13Fb33dE564C3e17E8428F8464AF49DB6d9`), set the amount of ETH you want to send to your node wallet, and click `Hire Node`. This will send a transaction and make your node "wake up" and starts working on your behalf. The amount of ETH you decide to send depends on how long you expect to run your node. You can expect each block you produce to spend around `156454` gas units, so you can [calculate](https://ethgasstation.info/calculatorTxV.php) how much ETH you will spend based on the network gas price. You should keep an eye in your node funds, and restock it whenever you fill like it.

## Goerli public network

Running on [goerli](https://goerli.net) is very similar to running on `mainnet`, with the following differences:

1) The command is:

```
docker run -it --rm --name cartesi_goerli_noether -v cartesi_goerli_wallet:/root/.ethereum cartesi/noether:wallet --url https://goerli.infura.io/v3/<project_id> --wallet /root/.ethereum/key --create --verbose
```

2) Cloudflare Ethereum gateway does not provide a goerli option, so we use [Infura](https://infura.io). You need to setup an Infura account, create an application and use the application URL in the command above.

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
