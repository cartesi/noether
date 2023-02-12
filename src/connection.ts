// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { StaticJsonRpcProvider } from "@ethersproject/providers";
import log from "loglevel";
import { createPoS, createWorkerManager } from "./contracts";
import * as wallet from "./wallet";

export const connect = async (
    url: string,
    accountIndex: number,
    walletFile: string | undefined,
    create: boolean
) => {
    log.info(`connecting to ${url}...`);
    const provider = new StaticJsonRpcProvider(url);

    // get network information
    const network = await provider.getNetwork();
    log.info(`connected to network '${network.name}' (${network.chainId})`);

    // create signer either from wallet or use provider as signer
    let signer;

    if (walletFile) {
        const w = await wallet.loadFromFile(walletFile, create);
        signer = w.connect(provider);
    } else if (process.env.MNEMONIC) {
        // create signer from mnemonic environment variable
        const mnemonic = process.env.MNEMONIC;
        const path = process.env.MNEMONIC_PATH;
        log.info(`loading wallet from MNEMONIC environment variable`);
        const w = await wallet.loadFromMnemonic(mnemonic, path);
        signer = w.connect(provider);
    } else if (process.env.SEED) {
        log.info(`loading wallet from SEED environment variable`);
        const w = await wallet.loadFromSeed(process.env.SEED);
        signer = w.connect(provider);
    } else {
        log.info(`using provider account ${accountIndex} as signer`);
        signer = provider.getSigner(accountIndex);
    }

    const address = await signer.getAddress();
    log.info(`starting worker ${address}`);

    // connect to contracts
    const pos = await createPoS(network, signer);
    const workerManager = await createWorkerManager(network, signer);

    return {
        provider,
        network,
        signer,
        address,
        pos,
        workerManager,
    };
};
