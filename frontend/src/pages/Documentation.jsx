import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Wallet, Users, Coins, TrendingUp, Shield, 
  AlertCircle, ChevronDown, ChevronRight, ExternalLink,
  Gift, PieChart, Zap, HelpCircle, ArrowLeft, Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeProvider';

const Documentation = () => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen size={20} />,
      content: [
        {
          title: 'Welcome to UnityLedger',
          content: `UnityLedger is a decentralized community savings platform that modernizes traditional stokvels using blockchain technology. Build wealth together with automated payouts and ULT token rewards.`
        },
        {
          title: 'Quick Start',
          steps: [
            'Install MetaMask or another Web3 wallet',
            'Connect your wallet and choose network (Somnia or Lisk)',
            'Get test tokens from the faucet',
            'Join an existing pool or create your own',
            'Start saving and earning rewards!'
          ]
        },
        {
          title: 'Key Features',
          list: [
            'Automated savings pools with transparent payouts',
            'Creator rewards for pool initiators',
            'ULT token rewards for participation',
            'Multi-network support (Somnia & Lisk)',
            'Bank-grade security on blockchain',
            'No middlemen or hidden fees'
          ]
        }
      ]
    },
    {
      id: 'wallet-connection',
      title: 'Wallet Connection',
      icon: <Wallet size={20} />,
      content: [
        {
          title: 'Connecting Your Wallet',
          content: `When you first visit UnityLedger, you'll see a welcome modal. Choose your preferred network to get started.`
        },
        {
          title: 'Supported Networks',
          subsections: [
            {
              title: 'Somnia Testnet',
              details: [
                'Chain ID: 50312',
                'Currency: STT (Somnia Test Token)',
                'RPC: https://dream-rpc.somnia.network',
                'Explorer: https://shannon-explorer.somnia.network',
                'Get STT: https://testnet.somnia.network/'
              ]
            },
            {
              title: 'Lisk Sepolia',
              details: [
                'Chain ID: 4202',
                'Currency: ETH',
                'RPC: https://rpc.sepolia-api.lisk.com',
                'Explorer: https://sepolia-blockscout.lisk.com',
                'Get ETH: Lisk Sepolia faucet'
              ]
            }
          ]
        },
        {
          title: 'Troubleshooting Connection',
          list: [
            'Ensure MetaMask is installed and unlocked',
            'Remove old "Somnia DevNet" if it exists',
            'Check you\'re on the correct network',
            'Clear browser cache if issues persist',
            'Try a different browser (Chrome/Brave recommended)'
          ]
        }
      ]
    },
    {
      id: 'savings-pools',
      title: 'Savings Pools',
      icon: <PieChart size={20} />,
      content: [
        {
          title: 'Understanding Pools',
          content: `Savings pools are the core of UnityLedger. Members contribute a fixed amount regularly, and payouts are automated through smart contracts. Each cycle, one member receives the total pool amount.`
        },
        {
          title: 'Creating a Pool',
          steps: [
            'Click "Create Pool" from dashboard or navigation',
            'Set contribution amount (in ETH or STT)',
            'Set maximum number of members',
            'Set creator fee percentage (optional)',
            'Review and confirm transaction',
            'Share pool ID with others to join'
          ]
        },
        {
          title: 'Joining a Pool',
          steps: [
            'Browse available pools on dashboard',
            'Click on a pool to view details',
            'Check contribution amount and members',
            'Click "Join Pool"',
            'Approve transaction in wallet',
            'Wait for enough members to start'
          ]
        },
        {
          title: 'Pool States',
          subsections: [
            {
              title: 'Open',
              details: ['Accepting new members', 'Can join by contributing', 'Not yet active']
            },
            {
              title: 'Active',
              details: ['Pool is full and running', 'Members contribute each cycle', 'Automatic payouts occurring']
            },
            {
              title: 'Completed',
              details: ['All members received payouts', 'Pool is finished', 'Can withdraw final amounts']
            }
          ]
        }
      ]
    },
    {
      id: 'ult-token',
      title: 'ULT Token',
      icon: <Coins size={20} />,
      content: [
        {
          title: 'What is ULT?',
          content: `ULT (UnityLedger Token) is the platform's reward token. Earn ULT by participating in pools, and use it for staking or governance.`
        },
        {
          title: 'Earning ULT',
          list: [
            'Join and participate in savings pools',
            'Create pools as a pool creator',
            'Complete cycles successfully',
            'Stake ULT for additional rewards',
            'Refer new users (coming soon)'
          ]
        },
        {
          title: 'Using ULT',
          list: [
            'Stake for 10% APY rewards',
            'Pay reduced fees on pools',
            'Participate in governance (coming soon)',
            'Access premium features (coming soon)'
          ]
        },
        {
          title: 'Getting ULT',
          steps: [
            'Visit the Faucet page',
            'Connect your wallet',
            'Request test ULT tokens',
            'Wait for transaction confirmation',
            'Check balance in dashboard'
          ]
        }
      ]
    },
    {
      id: 'staking',
      title: 'Staking',
      icon: <TrendingUp size={20} />,
      content: [
        {
          title: 'ULT Staking',
          content: `Stake your ULT tokens to earn 10% APY. Staked tokens help secure the network and participate in governance.`
        },
        {
          title: 'How to Stake',
          steps: [
            'Navigate to Stake page',
            'Enter amount of ULT to stake',
            'Choose staking duration',
            'Approve transaction',
            'Confirm staking in wallet',
            'Start earning rewards!'
          ]
        },
        {
          title: 'Staking Details',
          subsections: [
            {
              title: 'Rewards',
              details: ['10% APY on staked ULT', 'Rewards compound automatically', 'Claim anytime']
            },
            {
              title: 'Lock Period',
              details: ['Flexible staking (withdraw anytime)', 'Locked staking (higher rewards)', 'Early withdrawal penalties apply to locked stakes']
            }
          ]
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard Features',
      icon: <Users size={20} />,
      content: [
        {
          title: 'Dashboard Overview',
          content: `Your dashboard shows all your pools, balances, and activity in one place.`
        },
        {
          title: 'Key Metrics',
          list: [
            'Total Value Locked (TVL)',
            'Your ULT balance',
            'Active pools count',
            'Your pools (created and joined)',
            'Pending payouts',
            'Recent activity'
          ]
        },
        {
          title: 'Pool Sorting',
          content: `Sort pools by various criteria:`,
          list: [
            'Newest First - Recently created pools',
            'Amount: High to Low - Highest contribution pools',
            'APY: High to Low - Best returns',
            'Most Filled - Pools about to start',
            'Least Filled - Pools with space'
          ]
        },
        {
          title: 'Member Dashboard',
          content: `Access detailed view of your pools:`,
          list: [
            'View all pools you\'ve joined',
            'Track payout schedule',
            'See contribution history',
            'Claim ULT rewards',
            'Monitor pool status'
          ]
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Safety',
      icon: <Shield size={20} />,
      content: [
        {
          title: 'Smart Contract Security',
          content: `UnityLedger uses audited smart contracts deployed on Somnia and Lisk networks. All transactions are transparent and immutable on the blockchain.`
        },
        {
          title: 'Best Practices',
          list: [
            'Never share your seed phrase or private keys',
            'Always verify contract addresses',
            'Start with small amounts to test',
            'Keep your wallet software updated',
            'Use hardware wallets for large amounts',
            'Verify transactions before confirming'
          ]
        },
        {
          title: 'What We Do',
          list: [
            'Open-source smart contracts',
            'Regular security audits',
            'Multi-network redundancy',
            'Transparent operations',
            'Community governance',
            'Bug bounty program'
          ]
        }
      ]
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: <HelpCircle size={20} />,
      content: [
        {
          title: 'Frequently Asked Questions',
          faqs: [
            {
              q: 'What is a stokvel?',
              a: 'A stokvel is a traditional savings scheme where a group of people agree to contribute a fixed amount of money regularly. Each cycle, one member receives the total pool amount.'
            },
            {
              q: 'How do payouts work?',
              a: 'Payouts are automated through smart contracts. When a pool cycle completes, the smart contract automatically sends the total pool amount to the designated member for that cycle.'
            },
            {
              q: 'What are creator fees?',
              a: 'Pool creators can set a small fee (typically 1-5%) as an incentive for organizing and managing the pool. This fee is deducted from each payout.'
            },
            {
              q: 'Can I leave a pool early?',
              a: 'Once you join an active pool, you commit to all cycles. Leaving early may result in penalties and loss of rewards. Plan accordingly before joining.'
            },
            {
              q: 'What happens if someone doesn\'t pay?',
              a: 'All contributions are held in the smart contract. If a member doesn\'t contribute by the deadline, they may be removed from the pool and forfeit previous contributions.'
            },
            {
              q: 'Are my funds safe?',
              a: 'Funds are held in audited smart contracts on the blockchain. No single person can access the pooled funds. However, always do your own research and invest responsibly.'
            },
            {
              q: 'Which network should I use?',
              a: 'Both Somnia and Lisk are testnets. Choose based on: Somnia for ultra-fast transactions, Lisk for Ethereum compatibility. Both offer free test tokens.'
            },
            {
              q: 'How do I get test tokens?',
              a: 'Visit the Faucet page for ULT tokens. For network tokens: Somnia - use testnet.somnia.network, Lisk - use Lisk Sepolia faucet.'
            }
          ]
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <AlertCircle size={20} />,
      content: [
        {
          title: 'Common Issues',
          subsections: [
            {
              title: 'Wallet Won\'t Connect',
              solutions: [
                'Ensure MetaMask is unlocked',
                'Remove old network configurations',
                'Try refreshing the page',
                'Clear browser cache',
                'Try a different browser'
              ]
            },
            {
              title: 'Transaction Failed',
              solutions: [
                'Check you have enough gas tokens',
                'Verify correct network is selected',
                'Increase gas limit if needed',
                'Wait and try again if network is congested',
                'Check transaction on block explorer'
              ]
            },
            {
              title: 'Can\'t See My Pools',
              solutions: [
                'Ensure wallet is connected',
                'Verify you\'re on correct network',
                'Refresh the dashboard',
                'Check Member Dashboard for details',
                'Verify transaction was confirmed'
              ]
            },
            {
              title: 'Balance Not Updating',
              solutions: [
                'Wait for blockchain confirmation',
                'Click refresh button on dashboard',
                'Check transaction on explorer',
                'Try reconnecting wallet',
                'Clear cache and reload'
              ]
            }
          ]
        },
        {
          title: 'Getting Help',
          list: [
            'Check console (F12) for error messages',
            'Visit our Discord community',
            'Email support with transaction hash',
            'Check block explorer for transaction status',
            'Review documentation for solutions'
          ]
        }
      ]
    },
    {
      id: 'resources',
      title: 'Resources',
      icon: <ExternalLink size={20} />,
      content: [
        {
          title: 'Official Links',
          links: [
            { text: 'Somnia Documentation', url: 'https://docs.somnia.network' },
            { text: 'Somnia Testnet Faucet', url: 'https://testnet.somnia.network' },
            { text: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
            { text: 'Lisk Documentation', url: 'https://lisk.com/documentation' },
            { text: 'Lisk Explorer', url: 'https://sepolia-blockscout.lisk.com' },
            { text: 'MetaMask', url: 'https://metamask.io' }
          ]
        },
        {
          title: 'Community',
          links: [
            { text: 'Somnia Discord', url: 'https://discord.com/invite/somnia' },
            { text: 'Somnia Twitter', url: 'https://twitter.com/Somnia_Network' }
          ]
        },
        {
          title: 'Developer Resources',
          links: [
            { text: 'GitHub Repository', url: '#' },
            { text: 'Smart Contracts', url: '#' },
            { text: 'API Documentation', url: '#' }
          ]
        }
      ]
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    JSON.stringify(section.content).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <img src="/images/UL.png" alt="UnityLedger" className="h-12 w-12" />
            <div>
              <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                UnityLedger Documentation
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Everything you need to know about using UnityLedger
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 sticky top-24`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Contents
              </h3>
              <nav className="space-y-1">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      expandedSection === section.id
                        ? 'bg-indigo-600 text-white'
                        : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {filteredSections.map((section) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-6 ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-400">
                      {section.icon}
                    </div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {section.title}
                    </h2>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronDown className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  ) : (
                    <ChevronRight className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  )}
                </button>

                {expandedSection === section.id && (
                  <div className="p-6 pt-0 space-y-6">
                    {section.content.map((item, idx) => (
                      <div key={idx} className="space-y-4">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>

                        {item.content && (
                          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                            {item.content}
                          </p>
                        )}

                        {item.steps && (
                          <ol className="space-y-2">
                            {item.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {i + 1}
                                </span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}

                        {item.list && (
                          <ul className="space-y-2">
                            {item.list.map((listItem, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <ChevronRight size={16} className="flex-shrink-0 mt-1 text-indigo-600 dark:text-indigo-400" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                  {listItem}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {item.subsections && (
                          <div className="space-y-4 ml-4">
                            {item.subsections.map((sub, i) => (
                              <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {sub.title}
                                </h4>
                                <ul className="space-y-1">
                                  {sub.details.map((detail, j) => (
                                    <li key={j} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      • {detail}
                                    </li>
                                  ))}
                                </ul>
                                {sub.solutions && (
                                  <ul className="space-y-1">
                                    {sub.solutions.map((solution, j) => (
                                      <li key={j} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        ✓ {solution}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {item.faqs && (
                          <div className="space-y-4">
                            {item.faqs.map((faq, i) => (
                              <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  Q: {faq.q}
                                </h4>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  A: {faq.a}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.links && (
                          <div className="space-y-2">
                            {item.links.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                <ExternalLink size={16} />
                                <span>{link.text}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;