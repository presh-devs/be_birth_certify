// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BirthCertificateNFT
 * @dev NFT contract for minting birth certificates with metadata stored on IPFS
 */
contract BirthCertificateNFT is ERC721, ERC721URIStorage, Ownable {
    
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to certificate details
    mapping(uint256 => CertificateInfo) public certificates;
    
    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string name,
        string dateOfBirth,
        string placeOfBirth
    );
    
    struct CertificateInfo {
        string fullName;
        string dateOfBirth;
        string placeOfBirth;
        string certificateCID;
        uint256 mintedAt;
        bool verified;
    }
    
    constructor() ERC721("Birth Certificate NFT", "BCNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    /**
     * @dev Mint a new birth certificate NFT
     * @param to Address to mint the NFT to
     * @param uri IPFS URI containing the certificate metadata
     * @param fullName Full name of the person
     * @param dateOfBirth Date of birth
     * @param placeOfBirth Place of birth
     * @param certificateCID IPFS CID of the certificate PDF
     */
    function mintCertificate(
        address to,
        string memory uri,
        string memory fullName,
        string memory dateOfBirth,
        string memory placeOfBirth,
        string memory certificateCID
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        certificates[tokenId] = CertificateInfo({
            fullName: fullName,
            dateOfBirth: dateOfBirth,
            placeOfBirth: placeOfBirth,
            certificateCID: certificateCID,
            mintedAt: block.timestamp,
            verified: true
        });
        
        emit CertificateMinted(tokenId, to, fullName, dateOfBirth, placeOfBirth);
        
        return tokenId;
    }
    
    /**
     * @dev Simple mint function for backend integration
     * @param to Address to mint the NFT to
     * @param uri IPFS URI containing the certificate metadata
     */
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        return tokenId;
    }
    
    /**
     * @dev Get certificate information by token ID
     * @param tokenId The token ID to query
     */
    function getCertificateInfo(uint256 tokenId) public view returns (CertificateInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        return certificates[tokenId];
    }
    
    /**
     * @dev Verify if a certificate is authentic
     * @param tokenId The token ID to verify
     */
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        return certificates[tokenId].verified;
    }
    
    /**
     * @dev Get all certificates owned by an address
     * @param owner The address to query
     */
    function getCertificatesByOwner(address owner) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get total number of minted certificates
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}