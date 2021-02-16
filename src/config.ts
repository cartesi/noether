// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { parseEther } from "@ethersproject/units";

export const TIMEOUT = 24 * 60 * 60 * 1000;
export const RETRY_INTERVAL = 10000;
export const POLLING_INTERVAL = 30000;
export const CONFIRMATIONS = 1;
export const CONFIRMATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
export const GAS_LIMIT_MULTIPLIER = 160;
export const GAS_PRICE_MULTIPLIER = 160;
export const BALANCE_THRESHOLD = parseEther("0.05");
export const GAS_STATION_API_CHAIN_ID = 1;
export const GAS_STATION_API_URL =
    "https://ethgasstation.info/json/ethgasAPI.json";
export const GAS_STATION_API_KEY = undefined;
export const GAS_STATION_API_REQUEST_TIMEOUT_MS = 10000;
