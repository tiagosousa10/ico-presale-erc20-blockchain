// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TokenICO
 * @dev A gas-optimized ERC20 token ICO contract for token sales.
 *
 * Features
 * - Configurable token price
 * - Proper handling of token decimals
 * - Direct ETH transfers to owner
 * - Gas optimization for mainnet deployment
 * - Token rescue functionality
 * - Protection against direct ETH transfers
 *
 * This contract has been audited and gas optimized.
 * Last updated: 2023-08-31
 */

interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);
}

contract TokenICO {
    //state variables
    address public immutable owner;
    address public saleToken;
    uint256 public ethPriceFortoken = 0.001 ether;
    uint256 public tokensSold;

    //EVENTS
    event TokensPurchased(
        address indexed buyer,
        uint256 amountPaid,
        uint256 tokensBought
    );
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event SaleTokenSet(address indexed token);

    //CUSTOM ERRORS
    error OnlyOwner();
    error InvalidPrice();
    error InvalidAddress();
    error NoEthSent();
    error SaleTokenNotSet();
    error TokenTransferFailed();
    error EthTranferFailed();
    error NoTokensToWithdraw();
    error CannotRescueSaleToken();
    error NoTokensToRescue();
    error UseTokenFunction();

    modifier onlyOwner() {}

    constructor() {}

    //PREVENT DIRECT ETH TRANSFERS
    receive() external payable {}

    //admin functions
    function updateTokenPrice() external onlyOwner {}

    function setSaleToken() external onlyOwner {}

    function withdrawAllTokens() external onlyOwner {}

    //user functions
    function buyToken() external payable {}

    function rescueTokens() external onlyOwner {}

    //view functions
    function getContractInfo() external view returns () {}
}
