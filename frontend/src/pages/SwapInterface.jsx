// src/pages/SwapInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import {
  ArrowUpDown,
  Settings,
  Plus,
  TrendingUp,
  Star,
  Coins
} from 'lucide-react';
import { useWallet } from '../context/WalletProvider';
import { toast } from 'react-toastify';

//import ERC20_ABI from 'erc-20-abi';
import UNIVERSAL_ROUTER_ABI
  from '@uniswap/universal-router/artifacts/contracts/UniversalRouter.sol/UniversalRouter.json';

// Universal Router V4 address (Unichain)
const UNIVERSAL_ROUTER_ADDRESS = '0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d';

// Uniswap V4 execute command byte
const V4_SWAP_CMD = 3;
const ACTION_SWAP_EXACT_IN_SINGLE = 0;
const ACTION_SETTLE_ALL             = 1;
const ACTION_TAKE_ALL               = 2;

// Replace these placeholder addresses with your real token contracts
const tokensList = [
  { symbol: 'ULT',  name: 'Unity Ledger Token', address: '0x41cEbD1836122BD1A9677EDF838726D91ED37896', decimals: 18, verified: false },
  { symbol: 'ETH',  name: 'Ethereum',            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, verified: true  },
  { symbol: 'USDC', name: 'USD Coin',            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  verified: true  },
  { symbol: 'MEME', name: 'User Meme Token',     address: '0xYourMemeAddress', decimals: 18, verified: false },
  { symbol: 'DOGE2',name: 'Another Doge',        address: '0xYourDoge2Address', decimals: 18, verified: false }
];

export default function SwapInterface() {
  const { account, provider, signer } = useWallet();
  const [tokenIn,  setTokenIn]  = useState(tokensList[0]);
  const [tokenOut, setTokenOut] = useState(tokensList[1]);
  const [balanceIn,  setBalanceIn]  = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');
  const [amountIn,  setAmountIn]  = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage,  setSlippage]  = useState('0.5');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('swap');
  const [showDropdown, setShowDropdown] = useState({ in: false, out: false });
  const dropdownRef = useRef();

  // 1) Fetch on-chain balances whenever token or account changes
  useEffect(() => {
    if (!account || !provider) return;
    const cIn  = new ethers.Contract(tokenIn.address,  ERC20_ABI, provider);
    const cOut = new ethers.Contract(tokenOut.address, ERC20_ABI, provider);
    Promise.all([
      cIn.balanceOf(account),
      cOut.balanceOf(account)
    ])
      .then(([rawIn, rawOut]) => {
        setBalanceIn( ethers.utils.formatUnits(rawIn,  tokenIn.decimals) );
        setBalanceOut(ethers.utils.formatUnits(rawOut, tokenOut.decimals));
      })
      .catch(console.error);
  }, [account, provider, tokenIn, tokenOut]);

  // 2) Mock price-based estimate (replace with real quote)
  useEffect(() => {
    if (!amountIn || isNaN(amountIn)) {
      setAmountOut('');
    } else {
      const rate = tokenIn.symbol === 'ULT' ? 0.000375 : 2667;
      setAmountOut(
        (parseFloat(amountIn) * rate * (1 - parseFloat(slippage) / 100)).toFixed(6)
      );
    }
  }, [amountIn, tokenIn, slippage]);

  // 3) Close dropdown on outside click
  useEffect(() => {
    const onClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown({ in: false, out: false });
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Swap the "from" and "to" tokens
  const handleSwapTokens = () => {
    setTokenIn(prev => {
      setTokenOut(prevOut => prev);
      return tokenOut;
    });
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  // 4) Execute swap via Universal Router
  const handleSwap = async () => {
    if (!amountIn || !amountOut || !signer) return;
    setIsLoading(true);

    try {
      const router = new ethers.Contract(
        UNIVERSAL_ROUTER_ADDRESS,
        UNIVERSAL_ROUTER_ABI,
        signer
      );

      // Parse amounts
      const amtInWei  = ethers.utils.parseUnits(amountIn,  tokenIn.decimals);
      const amtOutMin = ethers.utils.parseUnits(
        (parseFloat(amountOut) * (1 - parseFloat(slippage) / 100))
          .toFixed(tokenOut.decimals),
        tokenOut.decimals
      );

      // Pool key (must match an existing pool)
      const poolKey = {
        currency0:  tokenIn.address,
        currency1:  tokenOut.address,
        fee:        3000,
        tickSpacing: 60,
        hooks:      ethers.constants.AddressZero
      };

      // Pack commands & actions
      const commands = ethers.utils.solidityPack(['uint8'], [V4_SWAP_CMD]);
      const actions  = ethers.utils.solidityPack(
        ['uint8','uint8','uint8'],
        [
          ACTION_SWAP_EXACT_IN_SINGLE,
          ACTION_SETTLE_ALL,
          ACTION_TAKE_ALL
        ]
      );

      // Encode the three steps
      const exactIn = ethers.utils.defaultAbiCoder.encode(
        ['tuple((address,address,uint24,int24,address),bool,uint128,uint128,bytes)'],
        [[ poolKey, true, amtInWei, amtOutMin, '0x' ]]
      );
      const settle = ethers.utils.defaultAbiCoder.encode(
        ['address','uint256'],
        [ poolKey.currency0, amtInWei ]
      );
      const take   = ethers.utils.defaultAbiCoder.encode(
        ['address','uint256'],
        [ poolKey.currency1, amtOutMin ]
      );

      const inputs = [ ethers.utils.defaultAbiCoder.encode(
        ['bytes','bytes[]'],
        [ actions, [exactIn, settle, take] ]
      )];

      // deadline = now + 20 minutes
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      // Send transaction
      const tx = await router.execute(commands, inputs, deadline);
      const receipt = await tx.wait();
      toast.success(`Swap succeeded: ${receipt.transactionHash.slice(0,10)}…`);

      // Clear inputs & refresh balances
      setAmountIn(''); setAmountOut('');
      await new Promise(r => setTimeout(r, 500));
      const [rawIn, rawOut] = await Promise.all([
        new ethers.Contract(tokenIn.address,  ERC20_ABI, provider).balanceOf(account),
        new ethers.Contract(tokenOut.address, ERC20_ABI, provider).balanceOf(account)
      ]);
      setBalanceIn( ethers.utils.formatUnits(rawIn,  tokenIn.decimals) );
      setBalanceOut(ethers.utils.formatUnits(rawOut, tokenOut.decimals));
    } catch (err) {
      console.error(err);
      toast.error(`Swap failed: ${err.message || err}`);
    }

    setIsLoading(false);
  };

  // Token selector dropdown component
  const TokenSelector = ({ token, onSelect, label, which }) => (
    <div className="relative" ref={which === 'in' ? dropdownRef : undefined}>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-2">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {token.symbol.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{token.symbol}</div>
              <div className="text-xs text-gray-500">
                Balance: {which==='in' ? balanceIn : balanceOut}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDropdown(s => ({ ...s, [which]: !s[which] }))}
            className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded text-sm"
          >
            Change
          </button>
        </div>
      </div>

      {showDropdown[which] && (
        <div className="absolute mt-1 right-0 bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-y-auto max-h-60 w-44 z-10">
          {tokensList.map(t => (
            <div
              key={t.address}
              onClick={() => {
                onSelect(t);
                setShowDropdown(s => ({ ...s, [which]: false }));
              }}
              className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
            >
              <span>{t.symbol}</span>
              {t.verified && <Star size={12} className="text-amber-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          ULT Token Exchange
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Swap tokens via Uniswap v4 Universal Router
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {[
          { id: 'swap',      label: 'Swap',       icon: ArrowUpDown },
          { id: 'liquidity', label: 'Liquidity',  icon: Plus      },
          { id: 'tokens',    label: 'Create Token',icon: Coins    }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'swap' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Swap Tokens
                </h2>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Settings size={20} className="text-gray-500" />
                </button>
              </div>

              <TokenSelector which="in"  label="From" token={tokenIn}  onSelect={setTokenIn} />
              <input
                type="number"
                value={amountIn}
                onChange={e => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white mb-4"
              />

              <div className="flex justify-center mb-4">
                <button
                  onClick={handleSwapTokens}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 bg-gray-50 dark:bg-gray-700"
                >
                  <ArrowUpDown size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <TokenSelector which="out" label="To" token={tokenOut} onSelect={setTokenOut} />
              <input
                type="number"
                value={amountOut}
                readOnly
                placeholder="0.0"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white mb-4"
              />

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Slippage Tolerance
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={slippage}
                      onChange={e => setSlippage(e.target.value)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      step="0.1"
                      min="0.1"
                      max="50"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSwap}
                disabled={!amountIn || !amountOut || isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Swapping…' : 'Swap Tokens'}
              </button>
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Liquidity Pools
              </h2>
              {/* … liquidity UI … */}
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Create Token
              </h2>
              {/* … create-token UI … */}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Platform Stats
            </h3>
            {/* … stats … */}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Popular Tokens
            </h3>
            {tokensList.slice(0, 4).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {t.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                      {t.symbol}
                      {t.verified && <Star size={12} className="text-amber-500" />}
                    </div>
                    <div className="text-xs text-gray-500">{t.name}</div>
                  </div>
                </div>
                <div className="text-right font-semibold text-gray-900 dark:text-white">
                  {t.decimals === 6 ? '$' + balanceOut : '$' + balanceIn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
