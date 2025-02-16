import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { NETWORKS } from "../raffle-interface/config/networks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: Object.entries(NETWORKS).reduce((acc, [key, network]) => ({
    ...acc,
    [key]: {
      url: network.rpcUrl,
      chainId: network.chainId,
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: "auto"
    }
  }), {})
};

export default config;