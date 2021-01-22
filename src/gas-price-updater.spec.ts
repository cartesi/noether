import log from "loglevel";
import { expect } from "chai";
import sinon from "sinon";
import { updateGasPrice } from "./gas-price-updater";
import axios from "axios";
import { getGasPrice, setGasPrice } from "./gas-price";
import { BigNumber, ethers } from "ethers";
import Ganache, { JsonRpcPayload, JsonRpcResponse } from "ganache-core";
import { JsonRpcFetchFunc } from "@ethersproject/providers/src.ts/web3-provider";
import { GAS_MULTIPLIER } from "./config";
import { Provider } from "@ethersproject/providers";

const sandbox = sinon.createSandbox();

describe("gas price updater test suite", () => {
    afterEach(() => {
        sandbox.restore();
        setGasPrice(null);
    });

    it("should update gas price", async () => {
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 450 },
            }),
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
        sandbox.restore();
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 750 },
            }),
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("75000000000");
    });

    it("should not update gas price on api error", async () => {
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 450 },
            }),
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
        sandbox.restore();
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.reject("test error"));
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
    });

    it("should not update gas price on missing average", async () => {
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 450 },
            }),
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
        sandbox.restore();
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.resolve({ data: {} }));
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
    });

    it("should use provider gas price on api error", async () => {
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.resolve({ data: {} }));
        const networkGasPrice = BigNumber.from("20000000000");
        const ganacheProvider = Ganache.provider({
            gasPrice: networkGasPrice.toString()
        });
        const provider = createEthersProviderFromGanache(ganacheProvider);
        await updateGasPrice(provider);
        const expectedGasPrice = BigNumber.from(networkGasPrice).mul(GAS_MULTIPLIER).div(100);
        expect(getGasPrice()!.toString()).to.be.eq(expectedGasPrice.toString());
    });
});

const createEthersProviderFromGanache = (ganacheProvider: Ganache.Provider): Provider => {
    const rpcFunc: JsonRpcFetchFunc = (method: string, params?: Array<any>): Promise<any> => {
        const payload: JsonRpcPayload = {
            jsonrpc: "",
            method,
            params: params && params || [],
        };
        return new Promise((s, e) => {
            const callback = (error: Error | null, result?: JsonRpcResponse) => {
                if (error) return e(error);
                if(result) return s(result.result);
                return s(null);
            };
            ganacheProvider.send(
                payload,
                callback,
            );
        });
    };
    return new ethers.providers.Web3Provider(rpcFunc);
}
