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
import log from "loglevel";
import { retryDecorator, NotRetryableError } from "ts-retry-promise";
import readlineSync from "readline-sync";
import { RETRY_INTERVAL, TIMEOUT } from "./config";
import { createPoS, createWorkerManager } from "./contracts";

const loadWallet = async (
    filename: string,
    create: boolean
): Promise<Wallet> => {
    log.info(`loading wallet from ${filename}`);

    if (!fs.existsSync(filename)) {
        if (!create) {
            // did not ask to create wallet if non-existant, raise an error
            log.error(`file ${filename} not found`);
            throw new NotRetryableError(`wallet ${filename} not found`);
        }

        // create new wallet
        log.info(`wallet does not exist, creating a new one`);
        const wallet = Wallet.createRandom();

        // create encrypted structured
        const password = readlineSync.questionNewPassword(
            "input new password: ",
            {
                cancel: true,
                caseSensitive: true,
                min: 8,
            }
        );
        const json = await wallet.encrypt(password);

        // save key V3
        fs.writeFileSync(filename, json);

        return wallet;
    } else {
        // load wallet from file
        const json = fs.readFileSync(filename, "utf-8");

        // read password from stdin
        const password = readlineSync.question("password: ", {
            cancel: true,
            hideEchoBack: true,
            mask: "*",
            caseSensitive: true,
        });

        // load wallet
        return Wallet.fromEncryptedJson(json, password);
    }
};

const _connect = async (
    url: string,
    accountIndex: number,
    wallet: string | undefined,
    create: boolean
) => {
    log.info(`connecting to ${url}...`);
    const provider = new ethers.providers.JsonRpcProvider(url);

    // get network information
    const network = await provider.getNetwork();
    log.info(`connected to network '${network.name}' (${network.chainId})`);

    // create signer either from wallet or use provider as signer
    const signer = wallet
        ? (await loadWallet(wallet, create)).connect(provider)
        : provider.getSigner(accountIndex);

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
    logger: log.warn,
    delay: RETRY_INTERVAL,
    retries: "INFINITELY",
    timeout: TIMEOUT,
});
