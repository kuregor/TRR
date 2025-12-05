import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("KWNcoin", (m) => {
    const token = m.contract("Token", ["KWNcoin", "KWN", 100000n * BigInt(1e18)]);

    const newOwner = '0x67C25dcBA11af5279f8f30d5F3BfE27F01a4Ce78';

    m.call(token, 'transferOwnership', [newOwner]);

    return { token };
});