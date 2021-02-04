import { BigNumber } from "ethers";
import {
    GAS_PRICE_MULTIPLIER,
    GAS_STATION_API_CHAIN_ID,
    GAS_STATION_API_ENABLED,
    GAS_STATION_API_KEY,
    GAS_STATION_API_PROFILE,
    GAS_STATION_API_REQUEST_TIMEOUT_MS,
    GAS_STATION_API_URL,
} from "../../config";
import GasStationGasPriceProvider, {
    GasStationGasPriceProviderOptions,
} from "./gas-station-gas-price-provider";
import ProviderGasPriceProvider from "./provider-gas-price-provider";
import ChainGasPriceProvider from "./chain-gas-price-provider";
import { Provider } from "@ethersproject/abstract-provider";
import { GasPriceProvider } from "../gas-price-provider";

export class AppGasPriceProvider implements GasPriceProvider {
    private readonly provider: Provider | null;
    private readonly chainId: number | null;

    constructor(
        provider: Provider | null = null,
        chainId: number | null = null
    ) {
        this.provider = provider;
        this.chainId = chainId;
    }

    getGasPrice(): Promise<BigNumber> {
        const gasPriceProviders = [];

        if (
            GAS_STATION_API_ENABLED &&
            this.chainId === GAS_STATION_API_CHAIN_ID
        ) {
            const gasStationOpts: GasStationGasPriceProviderOptions = {
                url: GAS_STATION_API_URL,
                key: GAS_STATION_API_KEY,
                timeout: GAS_STATION_API_REQUEST_TIMEOUT_MS,
                profile: GAS_STATION_API_PROFILE,
            };
            gasPriceProviders.push(
                new GasStationGasPriceProvider(gasStationOpts)
            );
        }

        if (this.provider) {
            gasPriceProviders.push(
                new ProviderGasPriceProvider(
                    this.provider,
                    GAS_PRICE_MULTIPLIER
                )
            );
        }

        const gasPriceProvider = new ChainGasPriceProvider(gasPriceProviders);
        return gasPriceProvider.getGasPrice();
    }
}
