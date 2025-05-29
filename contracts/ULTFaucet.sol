// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract ULTFaucet {
    IERC20Mintable public ultToken;
    address public owner;
    
    uint256 public faucetAmount = 500 * 10**18; // 500 ULT per claim
    uint256 public cooldownPeriod = 24 hours; // 24 hour cooldown
    uint256 public maxBalance = 2000 * 10**18; // Max 5000 ULT balance to claim
    bool public isActive = true;
    
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public totalClaimed;
    
    uint256 public totalDispensed;
    uint256 public totalUsers;
    
    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetConfigured(uint256 amount, uint256 cooldown, uint256 maxBalance);
    event FaucetToggled(bool active);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier faucetActive() {
        require(isActive, "Faucet is inactive");
        _;
    }
    
    constructor(address _ultToken) {
        ultToken = IERC20Mintable(_ultToken);
        owner = msg.sender;
    }
    
    function claimTokens() external faucetActive {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + cooldownPeriod,
            "Cooldown period not met"
        );
        
        require(
            ultToken.balanceOf(msg.sender) <= maxBalance,
            "Balance exceeds maximum allowed"
        );
        
        require(
            ultToken.balanceOf(address(this)) >= faucetAmount,
            "Insufficient faucet balance"
        );
        
        // Track new users
        if (lastClaimTime[msg.sender] == 0) {
            totalUsers++;
        }
        
        lastClaimTime[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += faucetAmount;
        totalDispensed += faucetAmount;
        
        require(ultToken.transfer(msg.sender, faucetAmount), "Transfer failed");
        
        emit TokensClaimed(msg.sender, faucetAmount, block.timestamp);
    }
    
    function canClaim(address user) external view returns (bool) {
        if (!isActive) return false;
        if (ultToken.balanceOf(user) > maxBalance) return false;
        if (block.timestamp < lastClaimTime[user] + cooldownPeriod) return false;
        return true;
    }
    
    function getTimeUntilNextClaim(address user) external view returns (uint256) {
        if (lastClaimTime[user] == 0) return 0;
        uint256 nextClaimTime = lastClaimTime[user] + cooldownPeriod;
        if (block.timestamp >= nextClaimTime) return 0;
        return nextClaimTime - block.timestamp;
    }
    
    // Owner functions
    function setFaucetAmount(uint256 _amount) external onlyOwner {
        require(_amount <= 2000 * 10**18, "Amount too high"); // Max 2000 ULT
        faucetAmount = _amount;
        emit FaucetConfigured(faucetAmount, cooldownPeriod, maxBalance);
    }
    
    function setCooldownPeriod(uint256 _period) external onlyOwner {
        require(_period >= 1 hours && _period <= 7 days, "Invalid cooldown");
        cooldownPeriod = _period;
        emit FaucetConfigured(faucetAmount, cooldownPeriod, maxBalance);
    }
    
    function setMaxBalance(uint256 _maxBalance) external onlyOwner {
        require(_maxBalance >= 500 * 10**18, "Max balance too low");
        maxBalance = _maxBalance;
        emit FaucetConfigured(faucetAmount, cooldownPeriod, maxBalance);
    }
    
    function toggleFaucet(bool _active) external onlyOwner {
        isActive = _active;
        emit FaucetToggled(_active);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(ultToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(ultToken.transfer(owner, amount), "Transfer failed");
    }
    
    function withdrawAllTokens() external onlyOwner {
        uint256 balance = ultToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(ultToken.transfer(owner, balance), "Transfer failed");
    }
    
    // View functions
    function getFaucetStats() external view returns (
        uint256 _totalDispensed,
        uint256 _totalUsers,
        uint256 _faucetAmount,
        uint256 _cooldownPeriod,
        uint256 _maxBalance,
        bool _isActive
    ) {
        return (
            totalDispensed,
            totalUsers,
            faucetAmount,
            cooldownPeriod,
            maxBalance,
            isActive
        );
    }
    
    function getUserStats(address user) external view returns (
        uint256 _totalClaimed,
        uint256 _lastClaimTime,
        uint256 _timeUntilNext,
        bool _canClaim
    ) {
        uint256 timeUntilNext = 0;
        if (lastClaimTime[user] > 0) {
            uint256 nextClaimTime = lastClaimTime[user] + cooldownPeriod;
            if (block.timestamp < nextClaimTime) {
                timeUntilNext = nextClaimTime - block.timestamp;
            }
        }
        
        return (
            totalClaimed[user],
            lastClaimTime[user],
            timeUntilNext,
            this.canClaim(user)
        );
    }
}