# [3.0.0](https://github.com/DismissibleIo/dismissible-react-client/compare/v2.1.0...v3.0.0) (2026-01-18)


### Features

* **batch:** support for the new batch endpoint ([#8](https://github.com/DismissibleIo/dismissible-react-client/issues/8)) ([748fa71](https://github.com/DismissibleIo/dismissible-react-client/commit/748fa71c4d3b1eafed694d06c478bebb8e9d2ea0))


### BREAKING CHANGES

* **batch:** Requires the new batch method on the http client

# [2.1.0](https://github.com/DismissibleIo/dismissible-react-client/compare/v2.0.0...v2.1.0) (2026-01-16)


### Features

* **fetch:** custom fetch client can be used via the provider ([#7](https://github.com/DismissibleIo/dismissible-react-client/issues/7)) ([1083205](https://github.com/DismissibleIo/dismissible-react-client/commit/108320575c980d7bd51f2185e22f4fc562db4cfe))

# [2.0.0](https://github.com/DismissibleIo/dismissible-react-client/compare/v1.0.0...v2.0.0) (2026-01-06)


### Bug Fixes

* **test:** fixed test race condition ([#6](https://github.com/DismissibleIo/dismissible-react-client/issues/6)) ([da56324](https://github.com/DismissibleIo/dismissible-react-client/commit/da5632458c61a734d7bd55c89ef28d78afeabbf4))


### Features

* **api:** aligned with api response ([#5](https://github.com/DismissibleIo/dismissible-react-client/issues/5)) ([8fe9f87](https://github.com/DismissibleIo/dismissible-react-client/commit/8fe9f879691f88cb761a8b4293c824a6d4477db2))


### BREAKING CHANGES

* **api:** You need to update any of your hook consumers to check dismissedAt instead of
dismissedOn. This aligns with the API response.

# 1.0.0 (2025-12-21)


### Features

* **react-client:** dismissible React Client ([#1](https://github.com/DismissibleIo/dismissible-react-client/issues/1)) ([a4e6dc7](https://github.com/DismissibleIo/dismissible-react-client/commit/a4e6dc7786a4fd1abb81f4a796e22d37fdc12e0b))


### BREAKING CHANGES

* **react-client:** This is the first public release which requires both the DismissibleProvider and
Dismissible components to be used to force a userId.
