> :warning: The Cartesi team keeps working internally on the next version of this repository, following its regular development roadmap. Whenever there's a new version ready or important fix, these are published to the public source tree as new releases.

# Noether Node

TODO

## Getting Started

### Requirements

- node 12+

### Build

```
yarn
```

## Usage

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

## Contributing

Thank you for your interest in Cartesi! Head over to our [Contributing Guidelines](CONTRIBUTING.md) for instructions on how to sign our Contributors Agreement and get started with
Cartesi!

Please note we have a [Code of Conduct](CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Authors

* *Danilo Tuler*
* *Gabriel Coutinho*

## License

The repository and all contributions are licensed under
[APACHE 2.0](https://www.apache.org/licenses/LICENSE-2.0). Please review our [LICENSE](LICENSE) file.
