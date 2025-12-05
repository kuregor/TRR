### Скрипт для запуска
- Remove-Item -Recurse -Force artifacts
- Remove-Item -Recurse -Force cache
- Remove-Item -Recurse -Force ignition\deployments 

- npx hardhat test
- npx hardhat compile
- npx hardhat ignition deploy --network sepolia ignition/modules/Token-deploy-owner.ts

- Внести АДРЕС_КОНТРАКТА в TOKEN_ADDRESS в UI (page.tsx)

- npx hardhat verify --network sepolia АДРЕС-КОНТРАКТА KWNcoin KWN 100000

- cd token-ui
- npm run dev


