- remove cache, artifacts, ignition/deployments

- Добавить в ignition\modules\Poster.ts свой адрес в MetaMask

- npx hardhat test

- npx hardhat ignition deploy --network sepolia ignition/modules/Poster.ts
- npx hardhat verify --network sepolia АДРЕС-ПОСТЕРА-ИЗ-ДЕПЛОЯ 0x0000000000000000000000000000000000000000 0

- В page.tsx вставить в POSTER_ADDRESS = АДРЕС-ПОСТЕРА-ИЗ-ДЕПЛОЯ

На (https://sepolia.etherscan.io/address/0xee2c38c8d10ad2174ba9907653d0805c2bc423dc) 
выполнить во вкладке write contract:
- setThreshold = 10000000000000000000
- SetTokenAddres = АДРЕС-ТОКЕНА

- cd lab4-ui 
- npm run dev