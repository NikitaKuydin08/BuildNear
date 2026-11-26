// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title BuilderBadge
/// @notice Proof that a builder was physically at an event. One badge per (wallet, event).
/// Transfers are blocked: a badge can be minted (by the app's wallet, after a venue check-in)
/// but never moved or sold, so it stays a record of attendance, not an asset.
contract BuilderBadge is ERC721, Ownable {
    error Soulbound();
    error AlreadyClaimed();

    uint256 public nextId = 1;
    mapping(uint256 tokenId => string) public eventName;
    mapping(address wallet => mapping(bytes32 eventKey => bool)) public hasBadge;

    constructor(address minter) ERC721("Builder Badge", "BADGE") Ownable(minter) {}

    /// @param eventSlug stable id of the event (e.g. "bangkok-ai-night-demo")
    /// @param name human-readable event title shown in wallets
    function mint(address to, string calldata eventSlug, string calldata name) external onlyOwner returns (uint256 id) {
        bytes32 key = keccak256(bytes(eventSlug));
        if (hasBadge[to][key]) revert AlreadyClaimed();
        hasBadge[to][key] = true;
        id = nextId++;
        eventName[id] = name;
        _safeMint(to, id);
    }

    /// @dev Only minting (from == 0) is allowed. Any transfer or burn by a holder reverts.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory name = eventName[tokenId];
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#0b0b0f"/>',
            '<circle cx="200" cy="150" r="70" fill="#f0b90b"/>',
            '<text x="200" y="260" fill="#fff" font-size="22" text-anchor="middle" font-family="sans-serif">Builder Badge</text>',
            '<text x="200" y="300" fill="#aaa" font-size="16" text-anchor="middle" font-family="sans-serif">',
            name,
            "</text></svg>"
        );
        string memory json = string.concat(
            '{"name":"Builder Badge #', Strings.toString(tokenId),
            '","description":"Attended: ', name,
            '. Non-transferable.","image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
