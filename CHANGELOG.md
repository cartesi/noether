# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2021-10-20

### Changes

-   Improving reliability of retire transaction

## [2.0.1] - 2021-10-01

### Changes

-   Fix ETH balance metric value
-   Fix log line

## [2.0.0] - 2021-09-28

### Changes

-   Support for staking pools
-   Monitoring metrics for Prometheus
-   Remove Heroku deployment button
-   Remove ARM docker images temporarily while we investigate build fail

## [1.2.0] - 2021-05-03

### Changed

-   Stop block production at deprecated protocol
-   Abort during startup if connection to ethereum gateway fails
-   Fix late log level initialization

### Added

-   Command to import MNEMONIC or SEED wallet to encrypted file

## [1.1.0] - 2021-03-01

### Added

-   Option to use [ETH Gas Station API](https://docs.ethgasstation.info) for enhanced gas price prediction
-   Docker image built for ARM V7 (32 bits), so it works with Raspberry PI 32 Bits OS
-   Support for graceful shutdown of docker container (CTRL-C)

### Changed

-   Reduced gas of block production by 23%
-   Reduced race conditions in some edge cases
-   Improved revert message in some cases of race conditions

## [1.0.4] - 2021-01-25

### Changed

-   Reduced usage of ethereum provider by 50% (good news for Infura users)

## [1.0.3] - 2021-01-23

### Added

-   Docker image built for ARM, so it works with Raspberry PI

## [1.0.2] - 2021-01-09

### Changed

-   Replacing clogged block producing transactions due to gas price spikes
-   Changed block producing log message to make it less confusing

## [1.0.1] - 2020-12-30

### Added

-   Returning retired node funds also during node startup

## [1.0.0] - 2020-12-06

-   First release

[unreleased]: https://github.com/cartesi/noether/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/cartesi/noether/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/cartesi/noether/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/cartesi/noether/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/cartesi/noether/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/cartesi/noether/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/cartesi/noether/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/cartesi/noether/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/cartesi/noether/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/cartesi/noether/releases/tag/v1.0.0
