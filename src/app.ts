// Copyright 2021 Cartesi Pte. Ltd.

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
import { constants } from "ethers";

import * as monitoring from "./monitoring";
import { sleep } from "./util";
import { connect } from "./connection";
import { BlockProducer } from "./block";
import { hire, retire, isPool } from "./worker";
import { POLLING_INTERVAL, BALANCE_THRESHOLD } from "./config";
import { PoolProtocolImpl, ProtocolClient, ProtocolImpl } from "./pos";
import {
    createGasPriceProvider,
    GasPriceProviderType,
} from "./gas-price/gas-price-provider";

const checkBalance = async (provider: Provider, address: string) => {
    // query node wallet ETH balance
    const balance = await provider.getBalance(address);

    // monitor ETH balance
    monitoring.balance.set(balance.div(constants.WeiPerEther).toNumber());

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
    create: boolean,
    monitor: boolean,
    hostname: string,
    port: number,
    gasPriceProviderType: GasPriceProviderType,
    gasStationAPIKey: string | undefined
) => {
    // connect to node
    const { address, network, pos, provider, workerManager } = await connect(
        url,
        accountIndex,
        wallet,
        create
    );

    // create gas price provider using specified type
    const gasPriceProvider = await createGasPriceProvider(
        provider,
        gasPriceProviderType,
        gasStationAPIKey
    );

    // set labels of metrics
    monitoring.register.setDefaultLabels({
        network: network.name,
        worker: address,
    });

    if (monitor) {
        // monitoring service
        monitoring.start(hostname, port);
    }

    // worker hiring
    const user = await hire(workerManager, gasPriceProvider, address);

    // set labels of metrics
    monitoring.register.setDefaultLabels({
        network: network.name,
        worker: address,
        user,
    });

    if (!user) {
        log.error(`failed to hire`);
        return;
    }

    // check if represented user is a pool
    const pool = await isPool(workerManager, user);
    if (pool) {
        log.info(`worker hired by pool ${user}`);
    } else {
        log.info(`worker hired by user ${user}`);
    }

    // create protocol client (smart contract communication)
    const client: ProtocolClient = pool
        ? new PoolProtocolImpl(pos, user, workerManager, gasPriceProvider)
        : new ProtocolImpl(pos, workerManager, gasPriceProvider);

    // create block producer
    const blockProducer = new BlockProducer(pos.address, client);

    // loop forever
    while (true) {
        try {
            // check if node retired
            if (await retire(workerManager, address)) {
                break;
            }

            // check node balance
            await checkBalance(pos.provider, address);

            // try to produce a block
            await blockProducer.produceBlock(user);

            // maintenance calls
            await blockProducer.rebalance();
        } catch (e) {
            // print the error, but continue polling
            log.error(e);

            // increase error counter
            monitoring.errors.inc();
        }

        // go to sleep
        await sleep(POLLING_INTERVAL);
    }
};
