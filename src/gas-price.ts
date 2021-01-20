import { BigNumber } from "ethers";

let gasPrice: BigNumber | null = null;

export const setGasPrice = (newGasPrice: BigNumber | null): void => {
    gasPrice = newGasPrice;
};

export const getGasPrice = (): BigNumber | null => {
    return gasPrice;
};
