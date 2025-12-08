import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toHex } from "viem";

const THRESHOLD = 10n;

describe("Poster", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();

  const creator = walletClients[0];
  const creatorAddress = creator.account.address;

  const malicious = walletClients[1];
  const maliciousAddress = malicious.account.address;

  it("post ok", async function () {
    // Deploy Token and Poster
    const token = await viem.deployContract("Token", [
      "TestToken",
      "TTKN",
      100n,
    ]);

    const poster = await viem.deployContract("Poster", [
      token.address,
      THRESHOLD,
    ]);

    // Creator should have full balance
    assert.equal(
      await token.read.balanceOf([creatorAddress]),
      100n
    );

    // No events before post
    const deploymentBlock = await publicClient.getBlockNumber();

    let eventsBefore = await publicClient.getContractEvents({
      address: poster.address,
      abi: poster.abi,
      eventName: "NewPost",
      fromBlock: deploymentBlock,
      strict: true,
    });
    assert.deepEqual(eventsBefore, []);

    // Post
    const content = "Hello, world!";
    const tag = "hello";

    await poster.write.post([content, tag], {
      account: creator.account,
    });

    // Expect one NewPost event after
    let eventsAfter = await publicClient.getContractEvents({
      address: poster.address,
      abi: poster.abi,
      eventName: "NewPost",
      fromBlock: deploymentBlock,
      strict: true,
    });

    assert.equal(eventsAfter.length, 1);

    // Явно говорим TS, что тут any, чтобы не было 'never'
    const posted: any = eventsAfter[0];

    assert.equal(
      posted.args.user.toLowerCase(),
      creatorAddress.toLowerCase()
    );
    assert.equal(posted.args.content, content);

    // keccak256 ждёт байты → хешируем toHex(tag)
    assert.equal(posted.args.tag, tag);

  });

  it("not enough tokens", async function () {
    // Deploy Token and Poster
    const token = await viem.deployContract("Token", [
      "TestToken",
      "TTKN",
      100n,
    ]);

    const poster = await viem.deployContract("Poster", [
      token.address,
      THRESHOLD,
    ]);

    // Creator has tokens, malicious does not
    assert.equal(
      await token.read.balanceOf([creatorAddress]),
      100n
    );
    assert.equal(
      await token.read.balanceOf([maliciousAddress]),
      0n
    );

    const content = "Hello, world!";
    const tag = "hello";

    try {
      await poster.write.post([content, tag], {
        account: malicious.account,
      });
      assert.fail("Should throw on not enough tokens");
    } catch (e: any) {
      // здесь можно проверять по сообщению, если хочешь
      assert.match(e.message, /Not enough tokens/);
    }
  });
});
