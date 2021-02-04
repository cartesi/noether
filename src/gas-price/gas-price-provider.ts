// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { Provider } from "@ethersproject/abstract-provider";
import {
    GAS_PRICE_MULTIPLIER,
    GAS_STATION_API_CHAIN_ID,
    GAS_STATION_API_ENABLED,
    GAS_STATION_API_KEY,
    GAS_STATION_API_PROFILE,
    GAS_STATION_API_REQUEST_TIMEOUT_MS,
    GAS_STATION_API_URL,
} from "../config";
import GasStationGasPriceProvider, {
    GasStationGasPriceProviderOptions,
} from "./providers/gas-station-gas-price-provider";
import ProviderGasPriceProvider from "./providers/provider-gas-price-provider";
import ChainGasPriceProvider from "./providers/chain-gas-price-provider";
import { BigNumber } from "ethers";

export interface GasPriceProvider {
    getGasPrice(): Promise<BigNumber>;
}

export const createGasPriceProvider = (
    provider: Provider,
    chainId: number | null = null
): ChainGasPriceProvider => {
    const gasPriceProviders = [];

    if (GAS_STATION_API_ENABLED && chainId === GAS_STATION_API_CHAIN_ID) {
        const gasStationOpts: GasStationGasPriceProviderOptions = {
            url: GAS_STATION_API_URL,
            key: GAS_STATION_API_KEY,
            timeout: GAS_STATION_API_REQUEST_TIMEOUT_MS,
            profile: GAS_STATION_API_PROFILE,
        };
        gasPriceProviders.push(new GasStationGasPriceProvider(gasStationOpts));
    }

    gasPriceProviders.push(
        new ProviderGasPriceProvider(provider, GAS_PRICE_MULTIPLIER)
    );

    return new ChainGasPriceProvider(gasPriceProviders);
};
