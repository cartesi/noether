import { expect } from "chai";
import { BigNumber } from "ethers";
import { getGasPrice, setGasPrice } from "./gas-price";

describe("gas price test suite", () => {
    afterEach(() => {
        setGasPrice(null);
    });

    it("should initialize gas price to null", async () => {
        expect(getGasPrice()).to.be.null;
    });

    it("should set gas price", async () => {
        const gasPrice = BigNumber.from("75000000000");
        setGasPrice(gasPrice);
        expect(getGasPrice()).to.be.eq(gasPrice);
    });
});
