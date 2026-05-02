> [!WARNING]
> **Effective September 15th, 2023, Mattermost, Inc. staff are no longer reviewing or merging pull requests for either Focalboard or the Mattermost Boards plugin in this repository (`mattermost/focalboard`). We encourage the community to fork this repository for continued development and contributions.**
>
> The reason behind these changes is to focus Mattermost developer resources on improving the platform’s performance and core features to ensure Mattermost continues being resilient, stable, and best-in-breed for critical operations.
>
> ️💡 [Learn more](https://forum.mattermost.com/t/upcoming-product-changes-to-boards-and-various-plugins/16669)

# Focalboard

![CI Status](https://github.com/mattermost/focalboard/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/mattermost/focalboard/actions/workflows/codeql-analysis.yml/badge.svg)
![Dev Release](https://github.com/mattermost/focalboard/actions/workflows/dev-release.yml/badge.svg)
![Prod Release](https://github.com/mattermost/focalboard/actions/workflows/prod-release.yml/badge.svg)

![Focalboard](website/site/static/img/hero.jpg)

Focalboard is an open source, multilingual, self-hosted project management tool that's an alternative to Trello, Notion, and Asana.

It helps define, organize, track and manage work across individuals and teams. Focalboard comes in three editions:

- **[Focalboard plugin](https://github.com/mattermost/focalboard/releases)**: The Focalboard plugin integrates into an exsting Mattermost instance to combine project management tools with messaging and collaboration for teams of all sizes.

- **[Personal Desktop](https://www.focalboard.com/docs/personal-edition/desktop/)**: A standalone, single-user [macOS](https://apps.apple.com/app/apple-store/id1556908618?pt=2114704&ct=website&mt=8), [Windows](https://www.microsoft.com/store/apps/9NLN2T0SX9VF?cid=website), or [Linux](https://www.focalboard.com/download/personal-edition/desktop/#linux-desktop) desktop app for your own todos and personal projects.

- **[Personal Server](https://www.focalboard.com/download/personal-edition/ubuntu/)**: A standalone, multi-user server for development and personal use.

## Try Focalboard

### Mattermost Plugin

After downloading and installing the plugin in the System Console, select the menu in the top left corner and select **Boards**. Access the latest releases of the focalboard plugin by downloading the `mattermost-plugin-focalboard.tar.gz` file from the releases in this repository: <https://github.com/mattermost/focalboard/releases>

### Personal Desktop (Windows, Mac or Linux Desktop)

- **Windows**: Download from the [Windows App Store](https://www.microsoft.com/store/productId/9NLN2T0SX9VF) or download `focalboard-win.zip` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and run `Focalboard.exe`.
- **Mac**: Download from the [Mac App Store](https://apps.apple.com/us/app/focalboard-insiders/id1556908618?mt=12).
- **Linux Desktop**: Download `focalboard-linux.tar.gz` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and open `focalboard-app`.

### Personal Server

**Ubuntu**: You can download and run the compiled Focalboard **Personal Server** on Ubuntu by following [our latest install guide](https://www.focalboard.com/download/personal-edition/ubuntu/).

### API Docs

Boards API docs can be found over at <https://htmlpreview.github.io/?https://github.com/mattermost/focalboard/blob/main/server/swagger/docs/html/index.html>

### Getting started

Our [developer guide](https://developers.mattermost.com/contribute/focalboard/personal-server-setup-guide) has detailed instructions on how to set up your development environment for the **Personal Server**. You can also join the [~Focalboard community channel](https://community.mattermost.com/core/channels/focalboard) to connect with other developers.

Clone [mattermost-server](https://github.com/mattermost/mattermost-server) into sibling directory.

Create an `.env` file in the focalboard directory that contains:

```
EXCLUDE_ENTERPRISE="1"
```

To build the server:

```
make prebuild
make
```

To run the server:

```
 ./bin/focalboard-server
```

Then navigate your browser to [`http://localhost:8000`](http://localhost:8000) to access your Focalboard server. The port is configured in `config.json`.

Once the server is running, you can rebuild just the web app via `make webapp` in a separate terminal window. Reload your browser to see the changes.

### Building and running standalone desktop apps

You can build standalone apps that package the server to run locally against SQLite:

- **Windows**:
  - _Requires Windows 10, [Windows 10 SDK](https://developer.microsoft.com/en-us/windows/downloads/sdk-archive/) 10.0.19041.0, and .NET 4.8 developer pack_
  - Open a `git-bash` prompt.
  - Run `make prebuild`
  - The above prebuild step needs to be run only when you make changes to or want to install your npm dependencies, etc.
  - Once the prebuild is completed, you can keep repeating the below steps to build the app & see the changes.
  - Run `make win-wpf-app`
  - Run `cd win-wpf/msix && focalboard.exe`
- **Mac**:
  - _Requires macOS 11.3+ and Xcode 13.2.1+_
  - Run `make prebuild`
  - The above prebuild step needs to be run only when you make changes to or want to install your npm dependencies, etc.
  - Once the prebuild is completed, you can keep repeating the below steps to build the app & see the changes.
  - Run `make mac-app`
  - Run `open mac/dist/Focalboard.app`
- **Linux**:
  - _Tested on Ubuntu 18.04_
  - Install `webgtk` dependencies
    - Run `sudo apt-get install libgtk-3-dev`
    - Run `sudo apt-get install libwebkit2gtk-4.0-dev`
  - Run `make prebuild`
  - The above prebuild step needs to be run only when you make changes to or want to install your npm dependencies, etc.
  - Once the prebuild is completed, you can keep repeating the below steps to build the app & see the changes.
  - Run `make linux-app`
  - Uncompress `linux/dist/focalboard-linux.tar.gz` to a directory of your choice
  - Run `focalboard-app` from the directory you have chosen
- **Docker**:
  - To run it locally from offical image:
    - `docker run -it -p 80:8000 mattermost/focalboard`
  - To build it for your current architecture:
    - `docker build -f docker/Dockerfile .`
  - To build it for a custom architecture (experimental):
    - `docker build -f docker/Dockerfile --platform linux/arm64 .`

Cross-compilation currently isn't fully supported, so please build on the appropriate platform. Refer to the GitHub Actions workflows (`build-mac.yml`, `build-win.yml`, `build-ubuntu.yml`) for the detailed list of steps on each platform.

### Unit testing

Before checking in commits, run `make ci`, which is similar to the `.gitlab-ci.yml` workflow and includes:

- **Server unit tests**: `make server-test`
- **Web app ESLint**: `cd webapp; npm run check`
- **Web app unit tests**: `cd webapp; npm run test`
- **Web app UI tests**: `cd webapp; npm run cypress:ci`

### Staying informed

- **Changes**: See the [CHANGELOG](CHANGELOG.md) for the latest updates
- **Bug Reports**: [File a bug report](https://github.com/mattermost/focalboard/issues/new?assignees=&labels=bug&template=bug_report.md&title=)
- **Chat**: Join the [~Focalboard community channel](https://community.mattermost.com/core/channels/focalboard)

---

## Configuration

All settings can be specified in `config.json` or via environment variables with the `FOCALBOARD_` prefix (e.g. `serverRoot` → `FOCALBOARD_SERVERROOT`, `filess3config.bucket` → `FOCALBOARD_FILESS3CONFIG_BUCKET`).

### Full config.json example

```json
{
  "serverRoot": "http://localhost:8000",
  "port": 8000,
  "dbtype": "sqlite3",
  "dbconfig": "./data/focalboard.db",
  "dbtableprefix": "",
  "useSSL": false,
  "secureCookie": false,
  "webpath": "./pack",
  "filesdriver": "local",
  "filespath": "./data/files",
  "maxfilesize": 0,
  "telemetry": true,
  "prometheusaddress": "",
  "secret": "",
  "session_expire_time": 2592000,
  "session_refresh_time": 18000,
  "localonly": false,
  "enableLocalMode": false,
  "localModeSocketLocation": "/var/tmp/focalboard_local.socket",
  "enablePublicSharedBoards": false,
  "authMode": "native",
  "oidc": {
    "enable": false,
    "providerUrl": "",
    "clientId": "",
    "clientSecret": "",
    "scopes": ["openid", "profile", "email"]
  },
  "filess3config": {
    "accesskeyid": "",
    "secretaccesskey": "",
    "bucket": "",
    "pathprefix": "",
    "region": "",
    "endpoint": "",
    "ssl": true,
    "signv2": false,
    "sse": false,
    "trace": false,
    "timeout": 30000
  },
  "enable_data_retention": false,
  "data_retention_days": 365,
  "notify_freq_card_seconds": 120,
  "notify_freq_board_seconds": 86400,
  "teammate_name_display": "username",
  "show_email_address": false,
  "show_full_name": false,
  "logging_cfg_file": "",
  "logging_cfg_json": "",
  "audit_cfg_file": "",
  "audit_cfg_json": ""
}
```

### Options reference

#### Server

| JSON key                   | Env variable                          | Type   | Default                            | Description                                                                 |
| -------------------------- | ------------------------------------- | ------ | ---------------------------------- | --------------------------------------------------------------------------- |
| `serverRoot`               | `FOCALBOARD_SERVERROOT`               | string | `http://localhost:8000`            | Public URL of the server (used in links and OIDC redirects)                 |
| `port`                     | `FOCALBOARD_PORT`                     | int    | `8000`                             | TCP port the server listens on                                              |
| `useSSL`                   | `FOCALBOARD_USESSL`                   | bool   | `false`                            | Serve over HTTPS (requires TLS cert/key on the server)                      |
| `secureCookie`             | `FOCALBOARD_SECURECOOKIE`             | bool   | `false`                            | Set the `Secure` flag on session cookies (requires HTTPS)                   |
| `webpath`                  | `FOCALBOARD_WEBPATH`                  | string | `./pack`                           | Path to compiled web assets                                                 |
| `localonly`                | `FOCALBOARD_LOCALONLY`                | bool   | `false`                            | Bind only to `127.0.0.1` (ignore connections from other hosts)              |
| `enableLocalMode`          | `FOCALBOARD_ENABLELOCALMODE`          | bool   | `false`                            | Enable Unix socket for local admin API calls                                |
| `localModeSocketLocation`  | `FOCALBOARD_LOCALMODESOCKETLOCATION`  | string | `/var/tmp/focalboard_local.socket` | Path to Unix socket when `enableLocalMode` is true                          |
| `enablePublicSharedBoards` | `FOCALBOARD_ENABLEPUBLICSHAREDBOARDS` | bool   | `false`                            | Allow boards to be shared with unauthenticated users via a link             |
| `secret`                   | `FOCALBOARD_SECRET`                   | string | `""`                               | Secret used to sign session tokens; set a strong random value in production |
| `session_expire_time`      | `FOCALBOARD_SESSION_EXPIRE_TIME`      | int    | `2592000`                          | Session lifetime in seconds (default: 30 days)                              |
| `session_refresh_time`     | `FOCALBOARD_SESSION_REFRESH_TIME`     | int    | `18000`                            | How often the session is refreshed in seconds (default: 5 hours)            |
| `prometheusaddress`        | `FOCALBOARD_PROMETHEUSADDRESS`        | string | `""`                               | Address to expose Prometheus metrics (e.g. `:9092`); empty = disabled       |

#### Database

| JSON key        | Env variable               | Type   | Default           | Description                                                         |
| --------------- | -------------------------- | ------ | ----------------- | ------------------------------------------------------------------- |
| `dbtype`        | `FOCALBOARD_DBTYPE`        | string | `sqlite3`         | Database backend: `sqlite3`, `postgres`, `mysql`, `libsql`, `d1`    |
| `dbconfig`      | `FOCALBOARD_DBCONFIG`      | string | `./focalboard.db` | Connection string (format varies by backend — see below)            |
| `dbtableprefix` | `FOCALBOARD_DBTABLEPREFIX` | string | `""`              | Prefix applied to every table name (useful when sharing a database) |

#### File storage

| JSON key      | Env variable             | Type   | Default   | Description                                                |
| ------------- | ------------------------ | ------ | --------- | ---------------------------------------------------------- |
| `filesdriver` | `FOCALBOARD_FILESDRIVER` | string | `local`   | Storage backend: `local` or `amazons3`                     |
| `filespath`   | `FOCALBOARD_FILESPATH`   | string | `./files` | Directory for uploaded files when `filesdriver` is `local` |
| `maxfilesize` | `FOCALBOARD_MAXFILESIZE` | int    | `0`       | Maximum upload size in bytes; `0` means unlimited          |

#### Notifications & display

| JSON key                    | Env variable                           | Type   | Default    | Description                                                                        |
| --------------------------- | -------------------------------------- | ------ | ---------- | ---------------------------------------------------------------------------------- |
| `notify_freq_card_seconds`  | `FOCALBOARD_NOTIFY_FREQ_CARD_SECONDS`  | int    | `120`      | Seconds to wait after the last card edit before sending a notification             |
| `notify_freq_board_seconds` | `FOCALBOARD_NOTIFY_FREQ_BOARD_SECONDS` | int    | `86400`    | Seconds to wait after the last board edit before sending a notification            |
| `teammate_name_display`     | `FOCALBOARD_TEAMMATE_NAME_DISPLAY`     | string | `username` | How teammate names are displayed: `username`, `full_name`, or `nickname_full_name` |
| `show_email_address`        | `FOCALBOARD_SHOW_EMAIL_ADDRESS`        | bool   | `false`    | Show email addresses to other users                                                |
| `show_full_name`            | `FOCALBOARD_SHOW_FULL_NAME`            | bool   | `false`    | Show full names to other users                                                     |

#### Data retention

| JSON key                | Env variable                       | Type | Default | Description                                                            |
| ----------------------- | ---------------------------------- | ---- | ------- | ---------------------------------------------------------------------- |
| `enable_data_retention` | `FOCALBOARD_ENABLE_DATA_RETENTION` | bool | `false` | Automatically delete old content                                       |
| `data_retention_days`   | `FOCALBOARD_DATA_RETENTION_DAYS`   | int  | `365`   | Content older than this many days is deleted when retention is enabled |

#### Authentication

| JSON key   | Env variable          | Type   | Default  | Description                                              |
| ---------- | --------------------- | ------ | -------- | -------------------------------------------------------- |
| `authMode` | `FOCALBOARD_AUTHMODE` | string | `native` | Authentication mode: `native` (built-in users) or `oidc` |

#### Logging & auditing

| JSON key           | Env variable                  | Type   | Default | Description                               |
| ------------------ | ----------------------------- | ------ | ------- | ----------------------------------------- |
| `logging_cfg_file` | `FOCALBOARD_LOGGING_CFG_FILE` | string | `""`    | Path to a JSON logging configuration file |
| `logging_cfg_json` | `FOCALBOARD_LOGGING_CFG_JSON` | string | `""`    | Inline JSON logging configuration         |
| `audit_cfg_file`   | `FOCALBOARD_AUDIT_CFG_FILE`   | string | `""`    | Path to a JSON audit configuration file   |
| `audit_cfg_json`   | `FOCALBOARD_AUDIT_CFG_JSON`   | string | `""`    | Inline JSON audit configuration           |

#### Admin users

The `admins` field is set via environment variable only (not a JSON key):

| Env variable        | Type                    | Description                                           |
| ------------------- | ----------------------- | ----------------------------------------------------- |
| `FOCALBOARD_ADMINS` | comma-separated strings | Usernames granted admin privileges (e.g. `alice,bob`) |

---

### Database connection strings

The `dbconfig` value format depends on `dbtype`:

| `dbtype`   | Example `dbconfig`                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `sqlite3`  | `./data/focalboard.db`                                                                         |
| `postgres` | `postgres://user:password@localhost/focalboard?sslmode=disable`                                |
| `mysql`    | `user:password@tcp(localhost:3306)/focalboard`                                                 |
| `libsql`   | Local sqld: `ws://localhost:8080` · Turso cloud: `libsql://db-name.turso.io?authToken=<TOKEN>` |
| `d1`       | `d1://<ACCOUNT_ID>/<DATABASE_ID>?token=<API_TOKEN>`                                            |

All five backends are compiled into the default binary. No build flags are required — just change `dbtype` and `dbconfig`.

#### PostgreSQL TLS

Append TLS parameters directly to the connection string, or use these environment variables (merged in automatically):

| Env variable                | Description                | Default   |
| --------------------------- | -------------------------- | --------- |
| `FOCALBOARD_DB_SSLMODE`     | PostgreSQL `sslmode`       | `disable` |
| `FOCALBOARD_DB_SSLROOTCERT` | Path to CA certificate     |           |
| `FOCALBOARD_DB_SSLCERT`     | Path to client certificate |           |
| `FOCALBOARD_DB_SSLKEY`      | Path to client key         |           |

#### MySQL TLS

| Env variable        | Description                                               | Default   |
| ------------------- | --------------------------------------------------------- | --------- |
| `FOCALBOARD_DB_TLS` | MySQL TLS mode: `preferred`, `required`, or `skip-verify` | `disable` |

#### Cloudflare D1

Get your `ACCOUNT_ID`, `DATABASE_ID`, and API token from [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages → D1**.

```bash
FOCALBOARD_DBTYPE=d1
FOCALBOARD_DBCONFIG=d1://<ACCOUNT_ID>/<DATABASE_ID>?token=<API_TOKEN>
```

> **Note:** D1 executes each SQL statement via the REST `/query` API individually. There is no server-side rollback on migration failure.

#### Turso / libsql

```bash
# Local sqld instance
FOCALBOARD_DBTYPE=libsql
FOCALBOARD_DBCONFIG=ws://localhost:8080

# Turso cloud
FOCALBOARD_DBTYPE=libsql
FOCALBOARD_DBCONFIG=libsql://db-name.aws-ap-northeast-1.turso.io?authToken=<TOKEN>
```

Regenerate a short-lived token: `turso db tokens create <db-name>`

---

### File Storage (S3 / Cloudflare R2)

Set `filesdriver` to `amazons3`, then populate the `filess3config` block:

| JSON key (`filess3config.*`) | Env variable                               | Description                             |
| ---------------------------- | ------------------------------------------ | --------------------------------------- |
| `accesskeyid`                | `FOCALBOARD_FILESS3CONFIG_ACCESSKEYID`     | Access key ID                           |
| `secretaccesskey`            | `FOCALBOARD_FILESS3CONFIG_SECRETACCESSKEY` | Secret access key                       |
| `bucket`                     | `FOCALBOARD_FILESS3CONFIG_BUCKET`          | Bucket name                             |
| `pathprefix`                 | `FOCALBOARD_FILESS3CONFIG_PATHPREFIX`      | Optional path prefix inside the bucket  |
| `region`                     | `FOCALBOARD_FILESS3CONFIG_REGION`          | AWS region or `auto` for Cloudflare R2  |
| `endpoint`                   | `FOCALBOARD_FILESS3CONFIG_ENDPOINT`        | Custom S3-compatible endpoint           |
| `ssl`                        | `FOCALBOARD_FILESS3CONFIG_SSL`             | Use HTTPS (`true`)                      |
| `signv2`                     | `FOCALBOARD_FILESS3CONFIG_SIGNV2`          | Use AWS Signature V2 (`false` for R2)   |
| `sse`                        | `FOCALBOARD_FILESS3CONFIG_SSE`             | Server-side encryption (`false` for R2) |
| `trace`                      | `FOCALBOARD_FILESS3CONFIG_TRACE`           | Log all S3 requests                     |
| `timeout`                    | `FOCALBOARD_FILESS3CONFIG_TIMEOUT`         | Request timeout in milliseconds         |

**Cloudflare R2 example:**

```json
"filesdriver": "amazons3",
"filess3config": {
  "endpoint": "<ACCOUNT_ID>.r2.cloudflarestorage.com",
  "region": "auto",
  "ssl": true,
  "signv2": false,
  "sse": false,
  "accesskeyid": "<R2_ACCESS_KEY_ID>",
  "secretaccesskey": "<R2_SECRET_ACCESS_KEY>",
  "bucket": "<BUCKET_NAME>"
}
```

---

### OIDC Authentication

Set `authMode` to `oidc`, then populate the `oidc` block:

| JSON key (`oidc.*`) | Env variable                   | Description                                                |
| ------------------- | ------------------------------ | ---------------------------------------------------------- |
| `enable`            | `FOCALBOARD_OIDC_ENABLE`       | Enable OIDC login (`true`)                                 |
| `providerUrl`       | `FOCALBOARD_OIDC_PROVIDERURL`  | OIDC discovery URL (e.g. `https://accounts.google.com`)    |
| `clientId`          | `FOCALBOARD_OIDC_CLIENTID`     | OAuth2 client ID                                           |
| `clientSecret`      | `FOCALBOARD_OIDC_CLIENTSECRET` | OAuth2 client secret                                       |
| `scopes`            | `FOCALBOARD_OIDC_SCOPES`       | Requested scopes (JSON array or comma-separated env value) |

**Keycloak example** (see `docker-compose.dev.yml` for a local Keycloak setup):

```json
"authMode": "oidc",
"oidc": {
  "enable": true,
  "providerUrl": "http://keycloak:8080/realms/focalboard",
  "clientId": "focalboard-client",
  "clientSecret": "<CLIENT_SECRET>",
  "scopes": ["openid", "profile", "email"]
}
```

The callback URL to register with your provider is:

```
<serverRoot>/api/v2/login/oidc/callback
```
