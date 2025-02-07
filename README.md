# CryptoTux Raffle 🎫

A decentralized and verifiable raffle system built on Moonbeam Network.

## Project Structure 📂

```
cryptotux-raffle/
├── RANDOMNESS.md          # Documentation on random number generation
├── README.md             # Main project documentation
│
├── docs/                 # Documentation and guides
│   ├── CUSTOMIZATION.md  # How to customize the raffle
│   ├── DEPLOYMENT.md     # Deployment instructions
│   ├── FORK.md          # How to fork and modify
│   └── LICENCE          # Project license
│
├── moonbeam-raffle/     # Smart Contract Implementation
│   ├── contracts/       # Smart contract source files
│   │   └── LocalVRFRaffle.sol    # Main raffle contract
│   ├── data/           # Configuration data
│   │   └── participants.ts        # Participant management
│   ├── scripts/        # Deployment and interaction scripts
│   │   ├── deploy.ts             # Contract deployment
│   │   ├── interact.ts           # Contract interaction
│   │   └── verify-participants.ts # Verification tools
│   └── ignition_backup/ # Deployment configurations backup
│
└── raffle-interface/    # Frontend Application
    ├── components/      # React component library
    │   ├── common/     # Shared UI components
    │   └── raffle/     # Raffle-specific components
    ├── config/         # Application configuration
    ├── constants/      # Global constants and contracts
    ├── hooks/          # Custom React hooks
    ├── pages/          # Next.js page components
    ├── public/         # Static assets and images
    ├── styles/         # Global styles and themes
    ├── types/          # TypeScript type definitions
    └── utils/          # Utility functions and helpers
```

## Quick Start 🚀

1. **Clone and Install**:
```bash
git clone https://github.com/cyphertux/cryptotux-raffle.git
cd cryptotux-raffle
```

2. **Smart Contracts**: See [moonbeam-raffle/README.md](./moonbeam-raffle/README.md)
3. **Frontend**: See [raffle-interface/README.md](./raffle-interface/README.md)
4. **Detailed Guides**: Check the [docs](./docs) folder

## Features ✨

- 🔒 **Secure & Verifiable**
  - Custom VRF implementation
  - Transparent random number generation
  - On-chain verification

- 🌐 **Multi-Network Support**
  - Moonbase Alpha (testnet)
  - Asset Hub Westend (Polkadot testnet)

- 🎯 **Fair Distribution**
  - Decentralized winner selection
  - Verifiable randomness
  - Anti-manipulation safeguards

- 📱 **Modern Interface**
  - Responsive design
  - Real-time updates
  - User-friendly interactions

## Documentation 📚

Comprehensive documentation available in the [docs](./docs) folder:
- [Randomness Generation](./RANDOMNESS.md)
- [Customization Guide](./docs/CUSTOMIZATION.md)
- [Deployment Instructions](./docs/DEPLOYMENT.md)
- [Forking Guide](./docs/FORK.md)

## Development Status 🚧

- ✅ Smart Contract Implementation
- ✅ Frontend Interface
- ✅ Basic Documentation
- 🔄 Advanced Features (In Progress)
- 🔄 Live Demo (Coming Soon)

## License 📄

This project is licensed under [LICENSE](./docs/LICENCE)

## Contact 📧

- Website: [cyphertux.net](https://www.cyphertux.net)
- Twitter: [@cyphertux](https://twitter.com/cyphertux)

## Contributing 🤝

Contributions are welcome! Please read our [Contributing Guidelines](./docs/FORK.md) first.
