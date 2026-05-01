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

* **[Focalboard plugin](https://github.com/mattermost/focalboard/releases)**: The Focalboard plugin integrates into an exsting Mattermost instance to combine project management tools with messaging and collaboration for teams of all sizes.

* **[Personal Desktop](https://www.focalboard.com/docs/personal-edition/desktop/)**: A standalone, single-user [macOS](https://apps.apple.com/app/apple-store/id1556908618?pt=2114704&ct=website&mt=8), [Windows](https://www.microsoft.com/store/apps/9NLN2T0SX9VF?cid=website), or [Linux](https://www.focalboard.com/download/personal-edition/desktop/#linux-desktop) desktop app for your own todos and personal projects.

* **[Personal Server](https://www.focalboard.com/download/personal-edition/ubuntu/)**: A standalone, multi-user server for development and personal use.

## Try Focalboard

### Mattermost Plugin

After downloading and installing the plugin in the System Console, select the menu in the top left corner and select **Boards**. Access the latest releases of the focalboard plugin by downloading the `mattermost-plugin-focalboard.tar.gz` file from the releases in this repository: <https://github.com/mattermost/focalboard/releases>

### Personal Desktop (Windows, Mac or Linux Desktop)

* **Windows**: Download from the [Windows App Store](https://www.microsoft.com/store/productId/9NLN2T0SX9VF) or download `focalboard-win.zip` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and run `Focalboard.exe`.
* **Mac**: Download from the [Mac App Store](https://apps.apple.com/us/app/focalboard-insiders/id1556908618?mt=12).
* **Linux Desktop**: Download `focalboard-linux.tar.gz` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and open `focalboard-app`.

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

* **Windows**:
  * *Requires Windows 10, [Windows 10 SDK](https://developer.microsoft.com/en-us/windows/downloads/sdk-archive/) 10.0.19041.0, and .NET 4.8 developer pack*
  * Open a `git-bash` prompt.
  * Run `make prebuild`
  * The above prebuild step needs to be run only when you make changes to or want to install your npm dependencies, etc.
  * Once the prebuild is completed, you can keep repeating the below steps to build the app & see the changes.
  * Run `make win-wpf-app`
  * Run `cd win-wpf/msix && focalboard.exe`
* **Mac**:
  * *Requires macOS 11.3+ and Xcode 13.2.1+*
  * Run `make prebuild`
  * The above prebuild step needs to be run only when you make changes to or want to install your npm dependencies, etc.
  * Once the prebuild is completed, you can keep repeating the below steps to build the app & see the changes.
  * Run `make mac-app`
  * Run `open mac/dist/Focalboard.app`
* **Linux**:
  * *Tested on Ubuntu 18.04*
  * Install `webgtk` dependencies
    * Run `sudo apt-get install libgtk-3-dev`
    * Run `sudo apt-get install libwebkit2gtk-4.0-dev`
  * Run `make prebuild`
  * The above prebuild step needs to be run only when you make changes to or want to install your npm dependencies, etc.
  * Once the prebuild is completed, you can keep repeating the below steps to build the app & see the changes.
  * Run `make linux-app`
  * Uncompress `linux/dist/focalboard-linux.tar.gz` to a directory of your choice
  * Run `focalboard-app` from the directory you have chosen
* **Docker**:
  * To run it locally from offical image:
    * `docker run -it -p 80:8000 mattermost/focalboard`
  * To build it for your current architecture:
    * `docker build -f docker/Dockerfile .`
  * To build it for a custom architecture (experimental):
    * `docker build -f docker/Dockerfile --platform linux/arm64 .`

Cross-compilation currently isn't fully supported, so please build on the appropriate platform. Refer to the GitHub Actions workflows (`build-mac.yml`, `build-win.yml`, `build-ubuntu.yml`) for the detailed list of steps on each platform.

### Unit testing

Before checking in commits, run `make ci`, which is similar to the `.gitlab-ci.yml` workflow and includes:

* **Server unit tests**: `make server-test`
* **Web app ESLint**: `cd webapp; npm run check`
* **Web app unit tests**: `cd webapp; npm run test`
* **Web app UI tests**: `cd webapp; npm run cypress:ci`

### Staying informed

* **Changes**: See the [CHANGELOG](CHANGELOG.md) for the latest updates
* **Bug Reports**: [File a bug report](https://github.com/mattermost/focalboard/issues/new?assignees=&labels=bug&template=bug_report.md&title=)
* **Chat**: Join the [~Focalboard community channel](https://community.mattermost.com/core/channels/focalboard)

---

## Configuration

All settings can be specified in `config.json` or via environment variables with the `FOCALBOARD_` prefix.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FOCALBOARD_SERVERROOT` | Public server root URL | `http://localhost:8000` |
| `FOCALBOARD_PORT` | Server listening port | `8000` |
| `FOCALBOARD_DBTYPE` | Database type: `sqlite3`, `postgres`, `mysql`, `libsql` | `sqlite3` |
| `FOCALBOARD_DBCONFIG` | Database connection string | `./focalboard.db` |
| `FOCALBOARD_DBPINGATTEMPTS` | DB connection retry attempts | `5` |
| `FOCALBOARD_DBTABLEPREFIX` | Database table name prefix | `""` |
| `FOCALBOARD_USESSL` | Enable HTTPS | `false` |
| `FOCALBOARD_SECURECOOKIE` | Set Secure flag on session cookies | `false` |
| `FOCALBOARD_WEBPATH` | Path to static web assets | `./pack` |
| `FOCALBOARD_FILESDRIVER` | File storage backend: `local`, `amazons3` | `local` |
| `FOCALBOARD_FILESPATH` | Local file storage path | `./files` |
| `FOCALBOARD_MAXFILESIZE` | Max upload size in bytes (0 = unlimited) | `0` |
| `FOCALBOARD_TELEMETRY` | Send anonymous usage telemetry | `true` |
| `FOCALBOARD_PROMETHEUSADDRESS` | Prometheus metrics address | `""` |
| `FOCALBOARD_SECRET` | Secret key for session signing | `""` |
| `FOCALBOARD_SESSION_EXPIRE_TIME` | Session lifetime in seconds | `2592000` (30 days) |
| `FOCALBOARD_SESSION_REFRESH_TIME` | Session refresh interval in seconds | `18000` (5 hours) |
| `FOCALBOARD_LOCALONLY` | Restrict to loopback interface only | `false` |
| `FOCALBOARD_ENABLELOCALMODE` | Enable Unix socket for local admin | `false` |
| `FOCALBOARD_LOCALMODESOCKETLOCATION` | Unix socket path | `/var/tmp/focalboard_local.socket` |
| `FOCALBOARD_ENABLEPUBLICSHAREDBOARDS` | Allow public board share links | `false` |
| `FOCALBOARD_AUTHMODE` | Authentication mode: `native`, `oidc` | `native` |
| `FOCALBOARD_ENABLE_DATA_RETENTION` | Enable automatic data deletion | `false` |
| `FOCALBOARD_DATA_RETENTION_DAYS` | Days to retain data | `365` |
| `FOCALBOARD_NOTIFY_FREQ_CARD_SECONDS` | Notification delay after card edit (seconds) | `120` |
| `FOCALBOARD_NOTIFY_FREQ_BOARD_SECONDS` | Notification delay after board edit (seconds) | `86400` |

### File Storage (S3 / Cloudflare R2)

Set `FOCALBOARD_FILESDRIVER=amazons3`, then configure the following:

| Variable | Description |
|----------|-------------|
| `FOCALBOARD_FILESS3CONFIG_ACCESSKEYID` | Access key ID |
| `FOCALBOARD_FILESS3CONFIG_SECRETACCESSKEY` | Secret access key |
| `FOCALBOARD_FILESS3CONFIG_BUCKET` | Bucket name |
| `FOCALBOARD_FILESS3CONFIG_PATHPREFIX` | Optional path prefix within the bucket |
| `FOCALBOARD_FILESS3CONFIG_REGION` | Region (`auto` for Cloudflare R2) |
| `FOCALBOARD_FILESS3CONFIG_ENDPOINT` | Custom endpoint (e.g. `<account-id>.r2.cloudflarestorage.com`) |
| `FOCALBOARD_FILESS3CONFIG_SSL` | Use HTTPS (`true` required for R2) |
| `FOCALBOARD_FILESS3CONFIG_SIGNV2` | Use AWS Signature V2 (set `false` for R2) |
| `FOCALBOARD_FILESS3CONFIG_SSE` | Server-side encryption (not supported by R2, use `false`) |
| `FOCALBOARD_FILESS3CONFIG_TRACE` | Enable request trace logging |
| `FOCALBOARD_FILESS3CONFIG_TIMEOUT` | Request timeout in milliseconds |

**Cloudflare R2 example:**
```bash
FOCALBOARD_FILESDRIVER=amazons3
FOCALBOARD_FILESS3CONFIG_ENDPOINT=<ACCOUNT_ID>.r2.cloudflarestorage.com
FOCALBOARD_FILESS3CONFIG_REGION=auto
FOCALBOARD_FILESS3CONFIG_SSL=true
FOCALBOARD_FILESS3CONFIG_SIGNV2=false
FOCALBOARD_FILESS3CONFIG_SSE=false
FOCALBOARD_FILESS3CONFIG_ACCESSKEYID=<R2_ACCESS_KEY_ID>
FOCALBOARD_FILESS3CONFIG_SECRETACCESSKEY=<R2_SECRET_ACCESS_KEY>
FOCALBOARD_FILESS3CONFIG_BUCKET=<BUCKET_NAME>
```

### OIDC Authentication

Set `FOCALBOARD_AUTHMODE=oidc`, then configure the following:

| Variable | Description |
|----------|-------------|
| `FOCALBOARD_OIDC_ENABLE` | Enable OIDC (`true`) |
| `FOCALBOARD_OIDC_PROVIDERURL` | OIDC provider discovery URL |
| `FOCALBOARD_OIDC_CLIENTID` | Client ID |
| `FOCALBOARD_OIDC_CLIENTSECRET` | Client secret |
| `FOCALBOARD_OIDC_SCOPES` | Scopes (comma-separated: `openid,profile,email`) |

### PostgreSQL TLS

| Variable | Description | Default |
|----------|-------------|---------|
| `FOCALBOARD_DB_SSLMODE` | PostgreSQL `sslmode` | `disable` |
| `FOCALBOARD_DB_SSLROOTCERT` | Path to CA certificate | |
| `FOCALBOARD_DB_SSLCERT` | Path to client certificate | |
| `FOCALBOARD_DB_SSLKEY` | Path to client key | |

### MySQL TLS

| Variable | Description | Default |
|----------|-------------|---------|
| `FOCALBOARD_DB_TLS` | MySQL TLS mode (`preferred`, `required`, `skip-verify`) | `disable` |

> These SSL/TLS variables are merged into `FOCALBOARD_DBCONFIG` automatically at startup.
