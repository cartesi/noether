// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import http from "http";
import url from "url";
import client from "prom-client";

// create a Registry which registers the metrics
export const register = new client.Registry();

// metric for the node ETH balance
export const balance = new client.Gauge({
    name: "noether_balance_eth",
    help: "ETH balance",
});

// metric for the stake value
export const stake = new client.Gauge({
    name: "noether_stake_ctsi",
    help: "CTSI stake the node owner",
});

// metric for counting production opportunities
export const eligibility = new client.Counter({
    name: "noether_eligibility_total",
    help: "Block production opportunities",
});

// metric for blocks produced
export const block = new client.Counter({
    name: "noether_block_total",
    help: "Blocks produced",
});

// metric for number of rebalances
export const rebalance = new client.Counter({
    name: "noether_rebalance_total",
    help: "Pool rebalance operations",
});

// metric for any kind of error raised during operation
export const errors = new client.Counter({
    name: "noether_errors_total",
    help: "Error counter",
});

register.registerMetric(balance);
register.registerMetric(stake);
register.registerMetric(eligibility);
register.registerMetric(block);
register.registerMetric(rebalance);
register.registerMetric(errors);

client.collectDefaultMetrics({
    register,
});

// define the HTTP server
const server = http.createServer(async (req, res) => {
    // retrieve route from request object
    const route = url.parse(req.url as string).pathname;

    if (route === "/metrics") {
        // Return all metrics the Prometheus exposition format
        res.setHeader("Content-Type", register.contentType);
        res.end(await register.metrics());
    }
});

export const start = (hostname: string, port: number) => {
    // Start the HTTP server which exposes the metrics on http://{hostname}:{port}/metrics
    log.info(`starting monitoring server at ${hostname}:${port}`);
    server.listen(port, hostname);
};
