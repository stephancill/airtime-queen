// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DummyYieldToken is ERC20, ReentrancyGuard {
    struct ReserveConfigurationMap {
        uint256 data;
    }

    struct ReserveData {
        ReserveConfigurationMap configuration;
        uint128 liquidityIndex;
        uint128 currentLiquidityRate;
        uint128 variableBorrowIndex;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }

    IERC20 public immutable underlyingToken;

    // Dummy fixed rate (0.0% expressed in RAY units - 27 decimals)
    uint128 public constant DUMMY_LIQUIDITY_RATE = 0 * 10 ** 25;

    constructor(
        IERC20 _underlyingToken,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        underlyingToken = _underlyingToken;
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external nonReentrant {
        require(asset == address(underlyingToken), "Invalid asset");
        require(amount > 0, "Amount must be greater than 0");

        // Transfer underlying tokens from user
        require(
            underlyingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Mint yield tokens 1:1
        _mint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external nonReentrant returns (uint256) {
        require(asset == address(underlyingToken), "Invalid asset");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= balanceOf(msg.sender), "Insufficient balance");

        // Burn yield tokens
        _burn(msg.sender, amount);

        // Return underlying tokens
        require(underlyingToken.transfer(to, amount), "Transfer failed");

        return amount;
    }

    function getReserveData(
        address asset
    ) external view returns (ReserveData memory) {
        require(asset == address(underlyingToken), "Invalid asset");

        return
            ReserveData({
                configuration: ReserveConfigurationMap({
                    data: 0 // All configuration bits set to 0
                }),
                liquidityIndex: 0, // 0% in RAY (1e27)
                currentLiquidityRate: 0, // 0% APY in RAY
                variableBorrowIndex: 0, // 0% in RAY
                currentVariableBorrowRate: 0, // 0% APY in RAY
                currentStableBorrowRate: 0, // 0% APY in RAY
                lastUpdateTimestamp: uint40(block.timestamp),
                id: 0, // First reserve
                aTokenAddress: address(this), // This contract acts as the aToken
                stableDebtTokenAddress: address(0), // No debt tokens in dummy implementation
                variableDebtTokenAddress: address(0), // No debt tokens in dummy implementation
                interestRateStrategyAddress: address(0), // No strategy in dummy implementation
                accruedToTreasury: 0, // No treasury accrual
                unbacked: 0, // No unbacked tokens
                isolationModeTotalDebt: 0 // No isolation mode debt
            });
    }
}
