// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Poster is Context {
    // === Событие как в лабе 2 ===
    event NewPost(address indexed user, string content, string tag);

    // === Параметры токен-гейта ===
    address public tokenAddress;
    uint256 public threshold;

    // === Владелец контракта ===
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _tokenAddress, uint256 _threshold) {
        tokenAddress = _tokenAddress;
        threshold = _threshold;

        owner = _msgSender();
        emit OwnershipTransferred(address(0), owner);
    }

    modifier onlyOwner() {
        require(owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Ownable: new owner is the zero address");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }

    // === Задание 1: смена адреса токена ===
    function setTokenAddress(address _newTokenAddress) external onlyOwner {
        tokenAddress = _newTokenAddress;
    }

    // === Задание 2: смена порога ===
    function setThreshold(uint256 _newThreshold) external onlyOwner {
        threshold = _newThreshold;
    }

    // === Основная функция постинга с проверкой баланса токена ===
    function post(string memory content, string memory tag) public {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(_msgSender());

        if (balance < threshold) {
            revert("Not enough tokens");
        }

        emit NewPost(_msgSender(), content, tag);
    }
}
