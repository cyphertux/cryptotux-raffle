import { useState } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { RAFFLE_ABI } from '../../constants/contracts';
import { NetworkConfig } from '../../config/networks';
import { CopyableValue } from '../common/CopyableValue';

interface VerifyButtonProps {
  winners: string[];
  network: NetworkConfig;
}

interface VerificationDetails {
  contractWinners: string[];
  currentBlock: number;
  verificationTime: string;
  drawBlock?: number;
  targetBlock?: number;
  reveal?: string;
  randomSeed?: string;
  deploymentBlock?: number;
  plannedDuration?: number;
}

interface DrawingDetails {
  drawBlock?: bigint;
  randomSeed?: string;
  reveal?: string;
}

export function VerifyButton({ winners, network }: VerifyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'verified' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<VerificationDetails | null>(null);

  const verifyWinners = async () => {
    try {
      setStatus('checking');
      setMessage('Vérification en cours...');
      
      const provider = new JsonRpcProvider(network.rpcUrl);
      const contract = new Contract(network.contractAddress!, RAFFLE_ABI, provider);
      
      // Récupération des données de base
      const [winnerIds, currentBlock, targetBlock, isComplete, contractDeploymentBlock] = await Promise.all([
        contract.getWinnerIds(),
        provider.getBlockNumber(),
        contract.targetBlock(),
        contract.isDrawingComplete(),
        contract.deploymentBlock()
      ]);

      // Calcul de la durée prévue en blocs
      const contractPlannedDuration = Number(targetBlock) - Number(contractDeploymentBlock);

      // Récupération des détails du tirage si terminé
      let drawingDetails: DrawingDetails = {};
      if (isComplete) {
        try {
          // Récupérer l'événement WinnersSelected avec une plage limitée
          const winnersSelectedFilter = contract.filters.WinnersSelected();
          const fromBlock = Math.max(0, currentBlock - 10000); // Limite à 10000 blocs
          const winnersSelectedEvents = await contract.queryFilter(winnersSelectedFilter, fromBlock, currentBlock);
          
          if (winnersSelectedEvents.length > 0) {
            const event = winnersSelectedEvents[0] as unknown as {
              blockNumber: number;
              args: [bigint[], string, string];
            };
            
            drawingDetails = {
              drawBlock: BigInt(event.blockNumber),
              randomSeed: event.args[1],
              reveal: event.args[2]
            };
          } else {
            // Si on ne trouve pas l'événement dans les 10000 derniers blocs, on élargit la recherche
            const fromBlock2 = Math.max(0, currentBlock - 50000);
            const winnersSelectedEvents2 = await contract.queryFilter(winnersSelectedFilter, fromBlock2, currentBlock);
            
            if (winnersSelectedEvents2.length > 0) {
              const event = winnersSelectedEvents2[0] as unknown as {
                blockNumber: number;
                args: [bigint[], string, string];
              };
              
              drawingDetails = {
                drawBlock: BigInt(event.blockNumber),
                randomSeed: event.args[1],
                reveal: event.args[2]
              };
            }
          }
          
          console.log('Détails récupérés:', drawingDetails);
        } catch (e) {
          console.log('Certains détails non disponibles:', e);
        }
      }
      
      const block = await provider.getBlock(currentBlock);
      const contractWinners = winnerIds.map((id: bigint) => `301-${id.toString()}`);
      const isValid = winners.every((winner, i) => winner === contractWinners[i]);
      
      setDetails({
        contractWinners,
        currentBlock,
        verificationTime: new Date(Number(block?.timestamp) * 1000).toLocaleString('fr-FR'),
        drawBlock: drawingDetails.drawBlock ? Number(drawingDetails.drawBlock) : undefined,
        targetBlock: Number(targetBlock),
        reveal: drawingDetails.reveal,
        randomSeed: drawingDetails.randomSeed,
        deploymentBlock: Number(contractDeploymentBlock),
        plannedDuration: contractPlannedDuration
      });
      
      if (isValid) {
        setStatus('verified');
        setMessage('Les résultats correspondent aux données du contrat');
      } else {
        setStatus('error');
        setMessage('Les résultats ne correspondent pas aux données du contrat');
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(`Erreur lors de la vérification: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <button
        onClick={verifyWinners}
        disabled={status === 'checking'}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium
          transition-colors flex items-center gap-2
          ${status === 'checking' 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
        `}
      >
        {status === 'checking' ? '🔍 Vérification...' : 
         status === 'verified' ? '✅ Résultats vérifiés' :
         status === 'error' ? '❌ Erreur' :
         '🔍 Vérifier les résultats'}
      </button>
      
      {message && (
        <p className={`text-sm ${
          status === 'verified' ? 'text-green-600 dark:text-green-400' : 
          status === 'error' ? 'text-red-600 dark:text-red-400' : 
          'text-gray-600 dark:text-gray-400'
        }`}>
          {message}
        </p>
      )}

      {details && status === 'verified' && (
        <div className="w-full mt-2 bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
            Détails de la vérification
          </h4>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            {/* Chronologie du tirage */}
            <div className="space-y-2">
              {details.deploymentBlock && (
                <p className="flex items-center gap-2">
                  <span>📅</span>
                  Déployé au bloc #{details.deploymentBlock}
                </p>
              )}
              {details.plannedDuration && (
                <p className="flex items-center gap-2">
                  <span>⏳</span>
                  Durée prévue : {details.plannedDuration} blocs
                </p>
              )}
              {details.targetBlock && (
                <p className="flex items-center gap-2">
                  <span>⏱️</span>
                  Tirage prévu au bloc #{details.targetBlock}
                </p>
              )}
              {details.drawBlock && (
                <p className="flex items-center gap-2">
                  <span>🎯</span>
                  Tirage effectué au bloc #{details.drawBlock}
                </p>
              )}
              {details.targetBlock && details.drawBlock && (
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <span>ℹ️</span>
                  {details.drawBlock - details.targetBlock} blocs après la cible
                </p>
              )}
            </div>

            {/* Données cryptographiques */}
            <div className="space-y-2">
            {details.randomSeed && (
                <CopyableValue
                label="Seed"
                value={details.randomSeed}
                icon="🎲"
                />
            )}
            {details.reveal && (
                <CopyableValue
                label="Reveal"
                value={details.reveal}
                icon="🔐"
                />
            )}
            </div>

            {/* Timestamp de vérification */}
            <div className="text-xs text-gray-500 pt-2">
              Vérifié le {details.verificationTime} (bloc #{details.currentBlock})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}