// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import fs from "fs";
import { Wallet } from "ethers";
import { HDNode } from "@ethersproject/hdnode";
import log from "loglevel";
import prompts from "prompts";

export const save = async (wallet: Wallet, filename: string) => {
    // create encrypted structured
    const password = await prompts({
        type: "password",
        name: "value",
        message: "new password",
    });

    const passwordRepeat = await prompts({
        type: "password",
        name: "value",
        message: "re-type password",
    });

    // check if passwords match, raise error if not
    if (password.value !== passwordRepeat.value) {
        throw new Error("passwords don't match");
    }

    const json = await wallet.encrypt(password.value);

    // save key V3
    log.info(`saving encrypted wallet to ${filename}`);
    fs.writeFileSync(filename, json);
};

export const create = async (filename: string): Promise<Wallet> => {
    // create new wallet
    const wallet = Wallet.createRandom();

    // save to file
    await save(wallet, filename);

    return wallet;
};

export const loadFromFile = async (
    filename: string,
    createIfNotExist: boolean
): Promise<Wallet> => {
    log.info(`loading wallet from ${filename}`);

    if (!fs.existsSync(filename)) {
        if (!createIfNotExist) {
            // did not ask to create wallet if non-existant, raise an error
            throw new Error(`file ${filename} not found`);
        }

        return create(filename);
    } else {
        // load wallet from file
        const json = fs.readFileSync(filename, "utf-8");

        // if CTSI_WALLET_PASSWORD env variable not set read from stdin
        const password = process.env.CTSI_WALLET_PASSWORD ? process.env.CTSI_WALLET_PASSWORD : (await prompts({
            type: "password",
            name: "value",
            message: "password",
        })).value;

        // load wallet
        return Wallet.fromEncryptedJson(json, password);
    }
};

export const loadFromSeed = async (seed: string): Promise<Wallet> => {
    return new Wallet(HDNode.fromSeed(`0x${seed}`));
};

export const loadFromMnemonic = async (
    mnemonic: string,
    path?: string
): Promise<Wallet> => {
    return Wallet.fromMnemonic(mnemonic, path);
};
