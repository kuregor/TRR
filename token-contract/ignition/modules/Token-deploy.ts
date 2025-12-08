import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Grib", (m) => {
    const token = m.contract("Token", ["Grib", "GRB", 100000n * BigInt(1e18)]);
        return { token };
    });