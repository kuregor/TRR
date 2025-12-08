import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
// keccak256 и toHex больше не нужны
// import { keccak256, toHex } from "viem";

describe("Poster", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const creator = walletClients[0];
  const creatorAddress = creator.account.address;
  const malicious = walletClients[1];
  const maliciousAddress = malicious.account.address;

  it("post ok", async function () {
    const poster = await viem.deployContract("Poster");

    const deploymentBlock = await publicClient.getBlockNumber();

    const eventsBefore = await publicClient.getContractEvents({
      address: poster.address,
      abi: poster.abi,
      eventName: "NewPost",
      fromBlock: deploymentBlock,
      strict: true,
    });
    assert.deepEqual(eventsBefore, []);

    const content = "Hello, world!";
    const tag = "hello";

    await poster.write.post([content, tag], { account: creator.account });

    const eventsAfter = await publicClient.getContractEvents({
      address: poster.address,
      abi: poster.abi,
      eventName: "NewPost",
      fromBlock: deploymentBlock,
      strict: true,
    });

    assert.equal(eventsAfter.length, 1);
    const posted = eventsAfter[0];

    assert.equal(posted.args.user.toLowerCase(), creatorAddress.toLowerCase());
    assert.equal(posted.args.content, content);

    // ВАЖНО: теперь сравниваем с plain-строкой, а не с хэшем
    assert.equal(posted.args.tag, tag);
  });
});
