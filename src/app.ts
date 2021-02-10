// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { Provider } from "@ethersproject/providers";
import { formatEther } from "@ethersproject/units";

import { sleep } from "./util";
import { connect } from "./connection";
import { BlockProducer } from "./block";
import { hire, retire } from "./worker";
import { checkVersion } from "./version";
import { POLLING_INTERVAL, BALANCE_THRESHOLD } from "./config";
import { client1, ProtocolImpl } from "./pos";
import { createGasPriceProvider } from "./gas-price/gas-price-provider";

const checkBalance = async (provider: Provider, address: string) => {
    const balance = await provider.getBalance(address);
    if (balance.lt(BALANCE_THRESHOLD)) {
        log.warn(
            `low balance: ${formatEther(balance)} ETH, transfer more funds`
        );
    }
};

export const app = async (
    url: string,
    accountIndex: number,
    wallet: string | undefined,
    gasPriceProviderType: string,
    create: boolean
) => {
    // connect to node
    const { address, pos, pos1, provider, workerManager } = await connect(
        url,
        accountIndex,
        wallet,
        create
    );

    // create gas price provider using eth provider
    // XXX: option to use eth gas station
    const gasPriceProvider = await createGasPriceProvider(provider);

    // worker hiring
    const user = await hire(workerManager, gasPriceProvider, address);

    if (!user) {
        log.error(`failed to hire`);
        return;
    }
    log.info(`worker hired by ${user}`);

    // create block producer for both protocols
    const blockProducer = new BlockProducer(
        pos.address,
        new ProtocolImpl(pos, workerManager, gasPriceProvider)
    );
    const blockProducer1 = new BlockProducer(
        pos1.address,
        new client1.ProtocolImpl(pos1, workerManager, gasPriceProvider)
    );

    // verify authorization
    const authorized = await blockProducer.authorize();
    const authorized1 = await blockProducer.authorize();

    const explorerUrl = "https://explorer.cartesi.io/staking";
    if (!authorized) {
        log.error(
            `worker not authorized to interact with PoS(${pos.address}), please go to ${explorerUrl} and authorize`
        );
        return;
    }
    if (!authorized1) {
        log.error(
            `worker not authorized to interact with PoS(${pos1.address}), please go to ${explorerUrl} and authorize`
        );
        return;
    }

    // loop forever
    while (true) {
        try {
            // check software version
            await checkVersion();

            // check if node retired
            if (await retire(workerManager, address)) {
                break;
            }

            // check node balance
            await checkBalance(pos.provider, address);

            // check and try to produce a block, on both protocols
            await blockProducer1.produceBlock(user);
            await blockProducer.produceBlock(user);
        } catch (e) {
            log.error(e);
        }

        // go to sleep
        await sleep(POLLING_INTERVAL);
    }
};
