// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import {
    GAS_PRICE_MULTIPLIER,
    GAS_STATION_API_CHAIN_ID,
    GAS_STATION_API_REQUEST_TIMEOUT_MS,
    GAS_STATION_API_URL,
    MAX_GAS_PRICE_GWEI,
} from "../config";
import GasStationGasPriceProvider from "./providers/gas-station-gas-price-provider";
import ProviderGasPriceProvider from "./providers/provider-gas-price-provider";
import ChainGasPriceProvider from "./providers/chain-gas-price-provider";
import { JsonRpcProvider } from "@ethersproject/providers";
import Eip1559GasPriceProvider, {
    Eip1559Profile,
} from "./providers/eip1559-gas-price-provider";
import { BigNumber } from "ethers";
import SpikeProtectionGasPriceProvider from "./providers/spike-protection-gas-price-provider";

export const gasPriceProviderTypes = [
    "eth-provider",
    "fastest",
    "fast",
    "average",
    "safeLow",
    "eip-1559-urgent",
    "eip-1559-fast",
    "eip-1559-normal",
] as const;

export type GasPriceProviderType =
    typeof gasPriceProviderTypes[keyof typeof gasPriceProviderTypes];

export type GasPriceOverride = {
    gasPrice: BigNumber;
};
export type GasPriceOverrideEip1559 = {
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
};
export type GasPriceOverrides = GasPriceOverride | GasPriceOverrideEip1559;

export interface GasPriceProvider {
    getGasPrice(): Promise<GasPriceOverrides>;
}

export const createGasPriceProvider = async (
    provider: JsonRpcProvider,
    type: GasPriceProviderType,
    apiKey: string | undefined = undefined
): Promise<GasPriceProvider> => {
    const network = await provider.getNetwork();
    const providerGasPriceProvider = new ProviderGasPriceProvider(
        provider,
        GAS_PRICE_MULTIPLIER
    );
    let proxiedGasPriceProvider: GasPriceProvider = providerGasPriceProvider;

    switch (type) {
        case "fastest":
        case "fast":
        case "average":
        case "safeLow":
            if (network.chainId !== GAS_STATION_API_CHAIN_ID) {
                log.warn(
                    `cannot use the gas price predictor from eth gas station on chain id #${network.chainId}`
                );
                break;
            }
            log.debug(
                `using gas price predictor from eth gas station with "${type}" profile`
            );
            const gasStationProvider = new GasStationGasPriceProvider({
                url: GAS_STATION_API_URL,
                key: apiKey,
                timeout: GAS_STATION_API_REQUEST_TIMEOUT_MS,
                profile: type,
            });
            proxiedGasPriceProvider = new ChainGasPriceProvider([
                gasStationProvider,
                providerGasPriceProvider,
            ]);
            break;
        case "eip-1559-urgent":
        case "eip-1559-fast":
        case "eip-1559-normal":
            try {
                await provider.send("eth_feeHistory", [1, "latest", []]);
            } catch (e) {
                log.warn(
                    'cannot use the eip-1559 gas price predictor as RPC provider does not support the "eth_feeHistory" method'
                );
                break;
            }
            let profile: Eip1559Profile;
            switch (type) {
                case "eip-1559-urgent":
                    profile = "urgent";
                    break;
                case "eip-1559-fast":
                    profile = "fast";
                    break;
                case "eip-1559-normal":
                    profile = "normal";
                    break;
            }
            proxiedGasPriceProvider = new Eip1559GasPriceProvider(
                provider,
                profile
            );
            break;
        default:
            log.debug(`using gas price predictor from ethereum provider`);
    }

    return new SpikeProtectionGasPriceProvider(
        proxiedGasPriceProvider,
        MAX_GAS_PRICE_GWEI
    );
};
