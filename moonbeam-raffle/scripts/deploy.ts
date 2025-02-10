import { ethers } from "hardhat";
import { NETWORKS } from "../../raffle-interface/config/networks";
import fs from "fs";
import path from "path";

async function main() {
  // Récupérer le réseau depuis les arguments ou utiliser le défaut
  const networkName = process.env.NETWORK || "moonbase";
  const network = NETWORKS[networkName];
  
  if (!network) {
    throw new Error(`Réseau ${networkName} non configuré`);
  }

  console.log(`\n🌐 Déploiement sur ${network.name}...`);
  console.log(`   RPC: ${network.rpcUrl}`);
  console.log(`   ChainID: ${network.chainId}`);
  
  // Récupérer le bloc actuel
  const currentBlock = await ethers.provider.getBlockNumber();
  
  // Définir quand le tirage aura lieu
  const BLOCKS_UNTIL_DRAW = 40;
  
  console.log(`\n📊 Informations de bloc:`);
  console.log(`   Bloc actuel: ${currentBlock}`);
  console.log(`   Bloc du tirage: ${currentBlock + BLOCKS_UNTIL_DRAW}`);
  console.log(`   Délai: ~${Math.round(BLOCKS_UNTIL_DRAW * network.blockTime / 60)} minutes`);

  // Générer le tableau des IDs de 1 à 148
  const participantIds = Array.from(
    { length: 148 }, 
    (_, index) => index + 1
  );
  
  // Générer un commit hash aléatoire
  const reveal = ethers.randomBytes(32);
  const commitHash = ethers.keccak256(reveal);
  
  console.log("\n📝 Déploiement du contrat...");
  const Raffle = await ethers.getContractFactory("LocalVRFRaffle");
  const raffle = await Raffle.deploy(participantIds, BLOCKS_UNTIL_DRAW, commitHash);
  
  // Attendre que le déploiement soit confirmé
  console.log("⏳ Attente de la confirmation...");
  await raffle.waitForDeployment();
  
  // Obtenir l'adresse du contrat
  const raffleAddress = await raffle.getAddress();

  // Mettre à jour la configuration avec la nouvelle adresse
  network.contractAddress = raffleAddress;
  
    // Sauvegarder la nouvelle configuration
    const configPath = path.join(__dirname, "../../raffle-interface/config/networks.ts");
    const configContent = `export interface NetworkConfig {
      name: string;
      rpcUrl: string;
      wsUrl: string;
      chainId: number;
      contractAddress?: string;
      explorerUrl: string;
      symbol: string;
      blockTime: number;
    }
  
    // Fonction helper pour récupérer l'adresse du contrat
    function getContractAddress(networkName: string, configuredAddress?: string): string {
      // Priorité à la variable d'environnement
      if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      }
      // Sinon utiliser l'adresse configurée
      return configuredAddress || '';
    }
  
    export const NETWORKS: { [key: string]: NetworkConfig } = ${JSON.stringify(NETWORKS, null, 2)};
  
    export const DEFAULT_NETWORK = "${networkName}";
    `;
  
  fs.writeFileSync(configPath, configContent);

  // Sauvegarder la valeur reveal pour une utilisation ultérieure
  const revealPath = path.join(__dirname, "../.reveal");
  fs.writeFileSync(revealPath, Buffer.from(reveal).toString('hex'));

  // Sauvegarder l'adresse du contrat
  const contractPath = path.join(__dirname, "../.contract");
  fs.writeFileSync(contractPath, raffleAddress);

  console.log(`\n✅ Raffle déployé avec succès sur ${network.name} !`);
  console.log(`\n📍 Informations de déploiement:`);
  console.log(`   Adresse: ${raffleAddress}`);
  console.log(`   Explorer: ${network.explorerUrl}/address/${raffleAddress}`);
  console.log(`   Bloc de tirage: ${await raffle.targetBlock()}`);
  console.log(`   Reveal value sauvegardée dans: ${revealPath}`);
  
  console.log("\n📋 Résumé:");
  console.log(`   - Réseau: ${network.name} (${network.chainId})`);
  console.log(`   - Nombre de participants: ${participantIds.length}`);
  console.log(`   - Premier ID: ${participantIds[0]}`);
  console.log(`   - Dernier ID: ${participantIds[participantIds.length - 1]}`);
  console.log(`   - Délai avant tirage: ${BLOCKS_UNTIL_DRAW} blocs`);
  console.log(`   - Temps estimé: ~${Math.round(BLOCKS_UNTIL_DRAW * network.blockTime / 60)} minutes\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Erreur lors du déploiement:");
    console.error(error);
    process.exit(1);
  });