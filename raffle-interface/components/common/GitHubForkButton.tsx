// components/common/GitHubForkButton.tsx
import React from 'react';

const GitHubForkButton = () => {
  return (
    <div className="absolute top-4 left-4">
      <a
        href="https://github.com/cyphertux/cryptotux-raffle/fork"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-lg group"
        title="Fork on GitHub"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="feather feather-git-fork"
        >
          <circle cx="12" cy="18" r="3"></circle>
          <circle cx="6" cy="6" r="3"></circle>
          <circle cx="18" cy="6" r="3"></circle>
          <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
          <line x1="12" y1="12" x2="12" y2="15"></line>
        </svg>
        <span className="hidden sm:inline">Fork on GitHub</span>
      </a>
    </div>
  );
};

export default GitHubForkButton;