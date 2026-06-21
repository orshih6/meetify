# meetify

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Troubleshooting

### Use Node.js 22

Use **Node.js 22** (tested with v22.23.0). Node 24 can break install and dev — for example `Error: Electron uninstall` or a missing `node_modules/electron/path.txt`.

```bash
# With nvm
nvm install 22.23.0
nvm use 22.23.0

# Reinstall after switching Node versions
rm -rf node_modules
pnpm install

node -v   # should print v22.x.x
pnpm dev
```

### `Error: Electron uninstall` on `pnpm dev`

If this persists on Node 22, Electron's native binary was not downloaded during install. `electron-vite` looks for `node_modules/electron/path.txt`, which is created by Electron's postinstall script.
