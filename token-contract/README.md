### Скрипт для запуска
- Remove artifacts, cache, ignition\deployments 

- Вставить свой АДРЕС-КОШЕЛЬКА в Token-deploy-owner.ts 

- npx hardhat test
- npx hardhat compile

- npx hardhat ignition deploy --network sepolia ignition/modules/Token-deploy-owner.ts

- Внести АДРЕС_КОНТРАКТА в TOKEN_ADDRESS в UI (page.tsx)

- npx hardhat verify --network sepolia АДРЕС-КОНТРАКТА Grib GRB 100000

- cd token-ui
- npm run dev

# Token 
- 0xb8f6E68F308Fb544F75aAA30e2f841d112e66199