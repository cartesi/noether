import log from "loglevel";
import axios from "axios";
import {
    GAS_MULTIPLIER,
    GAS_REQUEST_TIMEOUT_MS,
    GAS_STATION_URL,
} from "./config";
import { BigNumber } from "ethers";
import { setGasPrice } from "./gas-price";
import { Provider } from "@ethersproject/abstract-provider";

export const updateGasPrice = async (
    provider: Provider | null = null
): Promise<void> => {
    let gasPrice = null;
    try {
        const average = await requestGasStationAveragePrice();
        gasPrice = gasStationPriceToBigNumber(average);
    } catch (error) {
        log.error("failed to retrieve gas price", { error });
        if (provider) {
            gasPrice = await fetchProviderPrice(provider);
        }
    }
    setGasPrice(gasPrice);
    log.info("gas price updated", {
        gasPrice: gasPrice && gasPrice.toString(),
    });
};

const requestGasStationAveragePrice = async (): Promise<number> => {
    log.debug("fetching gas price");
    const response = await axios.get(GAS_STATION_URL, {
        timeout: GAS_REQUEST_TIMEOUT_MS,
    });
    const { data } = response;
    const { average } = data;
    if (typeof average !== "number") {
        throw new Error("ethgasstation did not return an average price");
    }
    return average;
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
