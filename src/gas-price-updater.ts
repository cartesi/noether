import log from "loglevel";
import axios from "axios";
import {
    GAS_MULTIPLIER,
    GAS_STATION_API_REQUEST_TIMEOUT_MS,
    GAS_STATION_API_ENABLED,
    GAS_STATION_API_PROFILE,
    GAS_STATION_API_KEY,
    GAS_STATION_API_URL,
} from "./config";
import { BigNumber } from "ethers";
import { setGasPrice } from "./gas-price";
import { Provider } from "@ethersproject/abstract-provider";

export const updateGasPrice = async (
    provider: Provider | null = null,
    useGasStation: boolean = false
): Promise<void> => {
    let gasPrice: BigNumber | null = null;
    if (useGasStation && GAS_STATION_API_ENABLED) {
        try {
            const gasStationPrice = await requestGasStationPrice();
            gasPrice = gasStationPriceToBigNumber(gasStationPrice);
        } catch (error) {
            log.error("failed to retrieve gas price", { error });
        }
    }
    if (!gasPrice && provider) {
        gasPrice = await fetchProviderPrice(provider);
    }
    if (gasPrice) {
        setGasPrice(gasPrice);
        log.info("gas price updated", {
            gasPrice: gasPrice && gasPrice.toString(),
        });
    }
};

const requestGasStationPrice = async (): Promise<number> => {
    log.debug("fetching gas price");
    let url = GAS_STATION_API_URL;
    if (GAS_STATION_API_KEY) url += `?api-key=${GAS_STATION_API_KEY}`;
    const response = await axios.get(url, {
        timeout: GAS_STATION_API_REQUEST_TIMEOUT_MS,
    });
    const { data } = response;
    const gasStationPrice = data[GAS_STATION_API_PROFILE];
    if (typeof gasStationPrice !== "number") {
        throw new Error(
            `ethgasstation did not return a ${GAS_STATION_API_PROFILE} price`
        );
    }
    return gasStationPrice;
};

const gasStationPriceToBigNumber = (gasStationPrice: number): BigNumber => {
    return (
        BigNumber.from(gasStationPrice)
            // gas price from Gas Station returned in Gwei/10
            // so multiply it by 10^8 to convert it to wei.
            .mul(10 ** 8)
    );
};

const fetchProviderPrice = async (provider: Provider): Promise<BigNumber> => {
    log.info("using provider gas price");
    const currentGasPrice = await provider.getGasPrice();
    return currentGasPrice.mul(GAS_MULTIPLIER).div(100);
};
