### Скрипт для запуска
- Remove-Item -Recurse -Force artifacts
- Remove-Item -Recurse -Force cache
- Remove-Item -Recurse -Force ignition\deployments 
- npx hardhat test
- npx hardhat compile
- npx hardhat ignition deploy ignition/modules/Poster-deploy.ts --network sepolia
- Добавить в poster-ui/app/page.tsx АДРЕС-КОНТРАКТА в POSTER_ADRESS
- npx hardhat verify --network sepolia АДРЕС-КОНТРАКТА

- cd poster-ui
- npm run dev

### Кран 
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia
