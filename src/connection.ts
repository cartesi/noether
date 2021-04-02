// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import fs from "fs";
import { ethers, Wallet } from "ethers";
import { HDNode } from "@ethersproject/hdnode";
import log from "loglevel";
import { retryDecorator } from "ts-retry-promise";
import prompts from "prompts";
import { RETRY_INTERVAL, TIMEOUT } from "./config";
import { createPoS, createWorkerManager } from "./contracts";

export const loadWallet = async (
    filename: string,
    create: boolean
): Promise<Wallet> => {
    log.info(`loading wallet from ${filename}`);

    if (!fs.existsSync(filename)) {
        if (!create) {
            // did not ask to create wallet if non-existant, raise an error
            throw new Error(`file ${filename} not found`);
        }

        // create new wallet
        log.info(`wallet does not exist, creating a new one`);
        const wallet = Wallet.createRandom();

        // create encrypted structured
        const password = await prompts({
            type: "password",
            name: "value",
            message: "new password",
        });
        const json = await wallet.encrypt(password.value);

        // save key V3
        log.info(`saving encrypted wallet to ${filename}`);
        fs.writeFileSync(filename, json);

        return wallet;
    } else {
        // load wallet from file
        const json = fs.readFileSync(filename, "utf-8");

        // read password from stdin
        const password = await prompts({
            type: "password",
            name: "value",
            message: "password",
        });

        // load wallet
        return Wallet.fromEncryptedJson(json, password.value);
    }
};

const _connect = async (
    url: string,
    accountIndex: number,
    walletFile: string | undefined,
    create: boolean
) => {
    log.info(`connecting to ${url}...`);
    const provider = new ethers.providers.StaticJsonRpcProvider(url);

    // get network information
    const network = await provider.getNetwork();
    log.info(`connected to network '${network.name}' (${network.chainId})`);

    // create signer either from wallet or use provider as signer
    let signer;

    if (walletFile) {
        const wallet = await loadWallet(walletFile, create);
        signer = wallet.connect(provider);
    } else if (process.env.MNEMONIC) {
        // create signer from mnemonic environment variable
        const mnemonic = process.env.MNEMONIC;
        const path = process.env.MNEMONIC_PATH;
        log.info(`loading wallet from MNEMONIC environment variable`);
        const wallet = Wallet.fromMnemonic(mnemonic, path);
        signer = wallet.connect(provider);
    } else if (process.env.SEED) {
        const seed = process.env.SEED;
        log.info(`loading wallet from SEED environment variable`);
        const hd = HDNode.fromSeed(`0x${seed}`);
        signer = new Wallet(hd, provider);
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

export const connect = retryDecorator(_connect, {
    logger: (msg) => log.error(msg),
    delay: RETRY_INTERVAL,
    retries: "INFINITELY",
    timeout: TIMEOUT,
});
