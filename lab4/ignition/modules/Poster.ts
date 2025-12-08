// ignition/modules/Poster-deploy-owner.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PosterModule", (m) => {
  const poster = m.contract("Poster", [
    "0x0000000000000000000000000000000000000000",
    0,
  ]);

  const newOwner = "0x67C25dcBA11af5279f8f30d5F3BfE27F01a4Ce78";

  m.call(poster, "transferOwnership", [newOwner]);

  return { poster };
});
