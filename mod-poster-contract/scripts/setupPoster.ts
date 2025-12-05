import { network } from "hardhat";

async function main() {
  const POSTER_ADDRESS = "0x15351c9E71517F8fF89c56A9146d93e4bC91e4fB"; // твой Poster
  const TOKEN_ADDRESS = "0x6a3586a1c893c35a1777fcc24e40eb898a95a474"; // твой Token
  const THRESHOLD = 10n * 10n ** 18n; // 10 токенов при decimals = 18

  const { viem } = await network.connect();
  const walletClients = await viem.getWalletClients();

  // ВАЖНО: этот аккаунт должен быть владельцем Poster
  const owner = walletClients[0];

  const poster = await viem.getContractAt("Poster", POSTER_ADDRESS);

  console.log("setTokenAddress...");
  await poster.write.setTokenAddress([TOKEN_ADDRESS], {
    account: owner.account,
  });

  console.log("setThreshold...");
  await poster.write.setThreshold([THRESHOLD], {
    account: owner.account,
  });

  console.log("Done");

    const currentToken = await poster.read.tokenAddress();
    const currentThreshold = await poster.read.threshold();

    console.log("tokenAddress:", currentToken);
    console.log("threshold:", currentThreshold.toString());

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


