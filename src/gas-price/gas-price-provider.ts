// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { Provider } from "@ethersproject/abstract-provider";
import {
    GAS_PRICE_MULTIPLIER,
    GAS_STATION_API_CHAIN_ID,
    GAS_STATION_API_KEY,
    GAS_STATION_API_REQUEST_TIMEOUT_MS,
    GAS_STATION_API_URL,
} from "../config";
import GasStationGasPriceProvider, {
    GasStationProfile,
} from "./providers/gas-station-gas-price-provider";
import ProviderGasPriceProvider from "./providers/provider-gas-price-provider";
import ChainGasPriceProvider from "./providers/chain-gas-price-provider";
import { BigNumber } from "ethers";

export type GasPriceProviderType = "eth-provider" | GasStationProfile;

export const gasPriceProviderTypes: ReadonlyArray<GasPriceProviderType> = [
    "eth-provider",
    "fast",
    "fastest",
    "safeLow",
    "average",
];

export interface GasPriceProvider {
    getGasPrice(): Promise<BigNumber>;
}

export const createGasPriceProvider = async (
    provider: Provider,
    type: GasPriceProviderType
): Promise<GasPriceProvider> => {
    const network = await provider.getNetwork();
    const providerGasPriceProvider = new ProviderGasPriceProvider(
        provider,
        GAS_PRICE_MULTIPLIER
    );

    if (
        type !== "eth-provider" &&
        network.chainId === GAS_STATION_API_CHAIN_ID
    ) {
        log.debug(
            `using gas price predictor from eth gas station with "${type}" profile`
        );
        const gasStationProvider = new GasStationGasPriceProvider({
            url: GAS_STATION_API_URL,
            key: GAS_STATION_API_KEY,
            timeout: GAS_STATION_API_REQUEST_TIMEOUT_MS,
            profile: type,
        });
        return new ChainGasPriceProvider([
            gasStationProvider,
            providerGasPriceProvider,
        ]);
    } else {
        log.debug(`using gas price predictor from ethereum provider`);
        return providerGasPriceProvider;
    }
};
