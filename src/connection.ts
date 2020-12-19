// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { ethers } from "ethers";
import log from "loglevel";
import { retryDecorator } from "ts-retry-promise";
import { RETRY_INTERVAL, TIMEOUT } from "./config";
import { createPoS, createWorkerManager } from "./contracts";

const _connect = async (url: string, accountIndex: number) => {
    log.info(`connecting to ${url}...`);
    const provider = new ethers.providers.JsonRpcProvider(url);

    // get network information
    const network = await provider.getNetwork();
    log.info(`connected to network '${network.name}' (${network.chainId})`);

    // get signer
    const signer = provider.getSigner(accountIndex);
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
    delay: RETRY_INTERVAL,
    retries: "INFINITELY",
    logger: log.warn,
    timeout: TIMEOUT,
});
