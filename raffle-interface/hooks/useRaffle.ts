// hooks/useRaffle.ts
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { NetworkConfig } from '../config/networks';

const RAFFLE_ABI = [
  "function isDrawingComplete() view returns (bool)",
  "function targetBlock() view returns (uint256)",
  "function getWinnerIds() view returns (uint256[3])",
  "function requestDrawing() external",
  "function getBlocksUntilDraw() external view returns (uint256)",
  "event DrawingInitiated(uint256 indexed targetBlock, uint256[] participants)"
];

export function useRaffle(network: NetworkConfig) {
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [targetBlock, setTargetBlock] = useState<number>(0);
  const [initialBlock, setInitialBlock] = useState<number>(0);
  const initialBlockRef = useRef<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [winners, setWinners] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [hasTriedExecution, setHasTriedExecution] = useState<boolean>(false);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [estimatedEndTime, setEstimatedEndTime] = useState<number | null>(null);
  const [smoothSecondsLeft, setSmoothSecondsLeft] = useState<number>(0);
  const lastUpdateTime = useRef<number>(Date.now());
  const isExecutingRef = useRef(false);

  const executeDrawing = async () => {
    if (isExecuting || hasTriedExecution) return;
    isExecutingRef.current = true;
    setIsExecuting(true);
    setHasTriedExecution(true);
    setError('');
  
    try {
      console.log('Démarrage de l\'exécution du tirage...');
      
      const response = await fetch('/api/execute-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}` 
        },
        body: JSON.stringify({ network: 'moonbase' })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error === 'Unauthorized'
          ? 'Erreur d\'authentification - Vérifiez NEXT_PUBLIC_API_SECRET'
          : data.error || 'Erreur lors de l\'exécution du tirage';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      return data;

    } catch (error: any) {
      console.error('Erreur lors du tirage:', error);
      throw error;
    } finally {
      isExecutingRef.current = false;
      setIsExecuting(false);
    }
};

const updateState = async () => {
  if (loading && isExecuting) return;

  // Si on a déjà les gagnants, on arrête le polling
  if (winners.length > 0) {
    setIsComplete(true);
    setLoading(false);
    return;
  }

  let provider: ethers.JsonRpcProvider | null = null;
  
  try {
    provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const contract = new ethers.Contract(
      network.contractAddress || '', 
      RAFFLE_ABI, 
      provider
    );

    // D'abord récupérer le bloc courant
    const current = await provider.getBlockNumber();
    setCurrentBlock(current);

    try {
      // Essayer de récupérer le bloc cible et l'état du tirage
      const [target, complete] = await Promise.all([
        contract.targetBlock(),
        contract.isDrawingComplete()
      ]);

      setTargetBlock(Number(target));
      setIsComplete(complete);

      if (complete) {
        const winnerIds = await contract.getWinnerIds();
        setWinners(winnerIds.map((id: bigint) => `301-${id.toString()}`));
        setLoading(false);
        return;
      }

      // Initialisation du bloc initial si nécessaire
      if (initialBlockRef.current === 0) {
        const blocksUntilDraw = await contract.getBlocksUntilDraw();
        const deploymentBlock = Number(target) - Number(blocksUntilDraw);
        initialBlockRef.current = deploymentBlock;
        setInitialBlock(deploymentBlock);
        console.log('Bloc de déploiement:', deploymentBlock);
      }

      // Calcul du temps restant
      const blocksRemaining = Math.max(0, Number(target) - current);
      if (blocksRemaining === 0) {
        setEstimatedEndTime(null);
        setSmoothSecondsLeft(0);
      } else {
        const totalSeconds = blocksRemaining * network.blockTime;
        setEstimatedEndTime(Date.now() + (Math.ceil(totalSeconds) * 1000));
      }

      // Vérifier si on doit exécuter le tirage
      if (current >= Number(target) && !isExecutingRef.current && !hasTriedExecution) {
        await executeDrawing();
      }

    } catch (contractError) {
      // Si erreur de contrat, on continue avec le bloc courant
      console.warn('Erreur contrat:', contractError);
    }

    setLoading(false);
  } catch (err) {
    console.error('Error in updateState:', err);
    setError("Erreur lors de la récupération des données");
  } finally {
    setLoading(false);
    if (provider && 'destroy' in provider) {
      try {
        (provider as any).destroy();
      } catch (e) {
        console.warn('Error closing provider:', e);
      }
    }
  }
};

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Tirage imminent";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `≈ ${minutes} minute${minutes > 1 ? 's' : ''} et ${remainingSeconds} seconde${remainingSeconds > 1 ? 's' : ''}`;
    }
    
    // Arrondir à l'entier le plus proche pour l'affichage
    const displaySeconds = Math.round(seconds);
    return `≈ ${displaySeconds} seconde${displaySeconds > 1 ? 's' : ''}`;
  };

  const calculateProgress = (current: number, target: number, initial: number) => {
    if (current >= target) return 100;
    if (initialBlockRef.current === 0) return 0;
    
    const totalBlocks = target - initialBlockRef.current;
    const blocksCompleted = current - initialBlockRef.current;
    const percentage = (blocksCompleted / totalBlocks) * 100;
    
    return Math.min(100, Math.max(0, Math.round(percentage * 100) / 100));
  };

  const progressPercentage = calculateProgress(currentBlock, targetBlock, initialBlock);

  useEffect(() => {
    setLoading(true);
    setError('');
    setHasTriedExecution(false);
    updateState();
    
    // Ne démarrer le polling que si le tirage n'est pas terminé
    const interval = setInterval(() => {
      if (isComplete) {
        clearInterval(interval);
        return;
      }
      updateState();
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isComplete]); // Ajouter isComplete comme dépendance

  useEffect(() => {
    const targetProgress = calculateProgress(currentBlock, targetBlock, initialBlockRef.current);
    let animationFrameId: number;
  
    const step = () => {
      setSmoothProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.1) return targetProgress;
        return prev + diff * 0.1;
      });
      animationFrameId = requestAnimationFrame(step);
    };
  
    animationFrameId = requestAnimationFrame(step);
  
    // Nettoyage de l'animation
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentBlock, targetBlock]);

  useEffect(() => {
    if (!estimatedEndTime) {
      setSmoothSecondsLeft(0);
      return;
    }
  
    const updateTimer = () => {
      const now = Date.now();
      const remaining = estimatedEndTime - now;
      
      // Conversion en secondes avec une décimale pour plus de fluidité
      const secondsRemaining = remaining / 1000;
      
      if (secondsRemaining <= 0.1) {
        setSmoothSecondsLeft(0);
        return;
      }
      
      // Arrondir à une décimale pour éviter les fluctuations
      setSmoothSecondsLeft(Math.round(secondsRemaining * 10) / 10);
      requestAnimationFrame(updateTimer);
    };
  
    updateTimer(); // Exécuter immédiatement la première fois
    const animationId = requestAnimationFrame(updateTimer);
    
    return () => cancelAnimationFrame(animationId);
  }, [estimatedEndTime]);

  return {
    currentBlock,
    targetBlock,
    initialBlock,
    isComplete,
    winners,
    loading,
    error,
    secondsLeft: smoothSecondsLeft, 
    isExecuting,
    hasTriedExecution,
    executeDrawing,
    updateState,
    formatTimeRemaining,
    calculateProgress,
    blocksRemaining: targetBlock - currentBlock,
    progressPercentage: calculateProgress(currentBlock, targetBlock, initialBlock),
    smoothProgress
  };
}