// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { parseEther } from "@ethersproject/units";

export const TIMEOUT = parseInt(<string>process.env.TIMEOUT);
export const RETRY_INTERVAL = parseInt(<string>process.env.RETRY_INTERVAL);
export const POLLING_INTERVAL = parseInt(<string>process.env.POLLING_INTERVAL);
export const CONFIRMATIONS = parseInt(<string>process.env.CONFIRMATIONS);
export const CONFIRMATION_TIMEOUT = parseInt(
    <string>process.env.CONFIRMATION_TIMEOUT
);
export const GAS_LIMIT_MULTIPLIER = parseInt(
    <string>process.env.GAS_LIMIT_MULTIPLIER
);
export const GAS_PRICE_MULTIPLIER = parseInt(
    <string>process.env.GAS_PRICE_MULTIPLIER
);
export const BALANCE_THRESHOLD = parseEther(
    <string>process.env.BALANCE_THRESHOLD
);
export const GAS_STATION_API_CHAIN_ID = parseInt(
    <string>process.env.GAS_STATION_API_CHAIN_ID
);
export const GAS_STATION_API_URL = process.env.GAS_STATION_API_URL;
export const GAS_STATION_API_REQUEST_TIMEOUT_MS = parseInt(
    <string>process.env.GAS_STATION_API_REQUEST_TIMEOUT_MS
);
