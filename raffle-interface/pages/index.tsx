// pages/index.tsx
import { NETWORKS, DEFAULT_NETWORK } from '../config/networks';
import { useRaffle } from '../hooks/useRaffle';
import { DrawingStatus } from '../components/raffle/DrawingStatus';
import { WinnersList } from '../components/raffle/WinnersList';
import { NetworkInfo } from '../components/raffle/NetworkInfo';
import { ThemeToggle } from '../components/ThemeToggle';
import GitHubForkButton from '@/components/common/GitHubForkButton';

export default function Home() {
  const network = NETWORKS[DEFAULT_NETWORK];
  const {
    currentBlock,
    targetBlock,
    isComplete,
    winners,
    loading,
    error,
    secondsLeft,
    isExecuting,
    formatTimeRemaining,
    blocksRemaining,
    progressPercentage,
    smoothProgress
  } = useRaffle(network);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <GitHubForkButton />
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center px-4 sm:px-6 lg:px-8 transition-colors">
      <GitHubForkButton />
      <ThemeToggle />
      <div className="max-w-3xl mx-auto flex-1 flex flex-col justify-center py-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors my-6">
        <div className="px-4 py-8 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8 transition-colors">
              Tirage Test sur {network.name}
            </h1>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 mb-6">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {!isComplete ? (
                <DrawingStatus
                  currentBlock={currentBlock}
                  targetBlock={targetBlock}
                  blocksRemaining={blocksRemaining}
                  secondsLeft={secondsLeft}
                  progressPercentage={progressPercentage}
                  smoothProgress={smoothProgress}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ) : (
                <WinnersList winners={winners} network={network} />
              )}

              <NetworkInfo network={network} />
            </div>
          </div>
        </div>
      </div>

      <footer className="max-w-3xl mx-auto w-full text-center text-sm text-gray-500 dark:text-gray-400 pb-4">
        <a
          href="https://cyphertux.net"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1"
        >
          By cyphertux.net{' '}
          <span role="img" aria-label="pirate flag" className="transform hover:scale-110 transition-transform">
            🏴‍☠️
          </span>
        </a>
      </footer>

      {isExecuting && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
            <p className="text-center mt-4 text-gray-900 dark:text-gray-200">
              Exécution du tirage en cours sur {network.name}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
