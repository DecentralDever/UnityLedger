UnityLedger 🌟
Decentralized Community Savings Platform
UnityLedger is a blockchain-based platform that modernizes traditional stokvels (rotating savings and credit associations) through smart contracts. Build wealth together with your community through secure, automated savings pools with transparent payouts and built-in rewards.
Show Image
🚀 Features
Core Functionality

🔄 Rotating Savings Pools: Create and join automated savings groups with scheduled payouts
💰 Transparent Payouts: Smart contract-enforced payout order based on join sequence
🏆 Creator Rewards: Pool creators earn rewards for managing successful savings groups
⚡ Multi-Chain Support: Deployed on Lisk Sepolia and Somnia networks
🪙 ULT Token Integration: Native token for reduced fees and yield rewards

Premium Features

💎 Premium Pools: Enhanced pools with higher yields and exclusive benefits
📈 Yield Generation: Earn additional returns on locked funds
🎯 Fee Discounts: ULT token holders receive reduced platform fees
🔐 Advanced Security: Enhanced protection for premium pool participants

User Experience

🎨 Modern Interface: Beautiful, responsive React frontend with dark/light modes
📱 Mobile Optimized: Seamless experience across all devices
🔗 Wallet Integration: Connect with MetaMask and other Web3 wallets
📊 Real-time Stats: Live tracking of pool performance and activity

🛠 Technical Stack
Blockchain

Smart Contracts: Solidity ^0.8.20
Framework: Hardhat with TypeScript
Networks: Lisk Sepolia, Somnia
Standards: ERC-20 (ULT Token), OpenZeppelin contracts

Frontend

Framework: React 18 with TypeScript
Build Tool: Vite
Styling: Tailwind CSS
Animations: Framer Motion
Wallet: ethers.js v6
Routing: React Router DOM

Key Libraries

@openzeppelin/contracts: Security-audited contract templates
hardhat: Ethereum development environment
ethers.js: Ethereum library for frontend interactions
framer-motion: Animation library for smooth UX

🚀 Quick Start
Prerequisites

Node.js v16+ and npm
MetaMask or compatible Web3 wallet
Git

Installation
bash# Clone the repository
git clone https://github.com/your-username/unityledger.git
cd unityledger

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
Environment Setup
Create a .env file with the following variables:
env# Network Configuration

SOMNIA_RPC_URL=your_somnia_rpc_url

# Private Keys (for deployment)
PRIVATE_KEY=your_private_key

# Contract Addresses (automatically filled after deployment)
VITE_SOMNIA_UNITY_LEDGER_ADDRESS=0xC2E82087CEce1850ba3F10926Ff56f558B7E6Ad0
VITE_SOMNIA_ULT_TOKEN_ADDRESS=0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f
VITE_SOMNIA_FAUCET_ADDRESS=0xBdc416E82FF7eD6d06be6028fd442e94538F42b9
Development
bash# Start the frontend development server
npm run dev

# In a new terminal, start local Hardhat network (optional)
npx hardhat node

# Run tests
npx hardhat test
📦 Deployment
Smart Contracts
Deploy to Lisk Sepolia:
bash# Deploy main contracts
npm run deploy:lisk

# Deploy ULT token
npm run deploy:lisktoken

# Configure ULT integration
npm run configure:lisk
Deploy to Somnia:
bash# Deploy main contracts
npm run deploy:somnia

# Deploy ULT token
npm run deploy:somniatoken

# Configure ULT integration
npm run configure:somnia
Frontend
bash# Build for production
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, AWS, etc.)
🏗 Architecture
Smart Contract Structure
contracts/
├── UnityLedger.sol          # Main savings pool contract
├── ULTToken.sol             # Native utility token
├── ULTFaucet.sol           # Token distribution for testing
└── interfaces/
    └── IERC20Mintable.sol   # Token interface
Frontend Structure
frontend/src/
├── components/              # Reusable UI components
├── pages/                  # Main application pages
├── services/               # Web3 and contract interactions
├── hooks/                  # Custom React hooks
└── utils/                  # Utility functions
🎯 Usage Guide
Creating a Savings Pool

Connect Wallet: Use the "Connect Wallet" button
Navigate: Go to "Create Pool" section
Configure Pool:

Set contribution amount (in ETH)
Choose cycle duration (in days)
Set maximum members (2-50)
Select pool purpose


Submit: Confirm transaction and wait for deployment

Joining a Pool

Browse Pools: View available pools on the dashboard
Select Pool: Choose a pool that matches your savings goals
Join: Click "Join Pool" and confirm transaction
Contribute: Make contributions according to the schedule

Pool Lifecycle

Funding Phase: Members join and make initial contributions
Active Phase: Regular contributions and scheduled payouts
Completion: All members receive payouts according to sequence

🔧 Development Scripts
bash# Testing
npm test                                    # Run contract tests
npm run test:integration:somnia            # Integration tests on Somnia

# Deployment
npm run deploy:somnia                      # Deploy to Somnia

# Token Management
npm run deploy:somniatoken                 # Deploy ULT on Somnia
npm run configure:lisk                     # Configure ULT integration on Lisk
npm run configure:somnia                   # Configure ULT integration on Somnia

# Frontend
npm run dev                                # Start development server
npm run build                              # Build for production
🌐 Supported Network
Somnia Testnet

Chain ID: 50312
RPC: [Somnia RPC]
Explorer: [Somnia Explorer]

🪙 ULT Token Features

Fee Discounts: Hold ULT tokens to reduce platform fees
Yield Rewards: Earn additional returns in premium pools
Governance: Future voting rights for platform decisions
Staking: Lock tokens for enhanced benefits

🔒 Security Features

Blacklist Protection: Automatic removal of non-contributing members
Fund Locking: Secure escrow during pool cycles
Creator Verification: Enhanced security for pool creators
Emergency Functions: Admin controls for extreme situations

🤝 Contributing
We welcome contributions to UnityLedger! Please follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

Development Guidelines

Follow existing code style and conventions
Add tests for new features
Update documentation as needed
Ensure all tests pass before submitting

📄 License
This project is licensed under the ISC License - see the LICENSE file for details.
🙏 Acknowledgments

OpenZeppelin: For secure smart contract templates
Hardhat: For excellent development tooling
React & Vite: For modern frontend development
Tailwind CSS: For beautiful, responsive styling
Community: For inspiration and feedback

📞 Support

Discord: https://discord.com/invite/zext2bwkaE
X: @Unity_Ledger
Email: unity.ledger1@gmail.com


Built with ❤️ for the decentralized finance community
Transform your savings, empower your community, and build wealth together with UnityLedger.
