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
