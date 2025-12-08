// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.9.0;

contract Poster {
    event NewPost(address indexed user, string content, string tag);

    function post(string memory content, string memory tag) external {
        emit NewPost(msg.sender, content, tag);
    }
}
