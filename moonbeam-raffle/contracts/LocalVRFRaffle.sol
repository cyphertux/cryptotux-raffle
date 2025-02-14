// SPDX-License-Identifier: MIT
/**
 * @title CryptoTux Raffle Smart Contract
 * @author CypherTux
 * @notice Secure and verifiable raffle implementation
 * @copyright 2025 CypherTux
 * @dev Implementation of a decentralized raffle system
 */

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SecureLocalRaffle
/// @notice Secure raffle contract for CryptoTux
/// @dev Implements several security mechanisms
contract LocalVRFRaffle is ReentrancyGuard, Pausable, Ownable(msg.sender) {
    // Constants
    uint256 public constant MAX_PARTICIPANTS = 1000;
    uint256 public constant MIN_PARTICIPANTS = 3;
    uint256 private immutable BLOCKS_UNTIL_DRAW;
    uint256 public immutable deploymentBlock;

    // Structures
    struct DrawingResult {
        uint256[3] winnerIds;
        bytes32 randomSeed;
        uint256 drawBlock;
        bytes32 commitReveal;
    }

    // État
    uint256[] public participantIds;
    uint256 public targetBlock;
    DrawingResult public result;
    bool public isDrawingComplete;
    bytes32 private commitHash;
    mapping(address => bool) public authorizedDrawers;

    // Events
    event DrawingInitiated(uint256 targetBlock, uint256 participantCount);
    event DrawerAuthorized(address drawer);
    event DrawerRevoked(address drawer);
    event CommitHashSet(bytes32 commitHash);
    event WinnersSelected(uint256[3] winnerIds, bytes32 randomSeed, bytes32 commitReveal);

    /// @notice Constructeur du contrat
    /// @param _participantIds Liste des IDs des participants
    /// @param _blocksUntilDraw Nombre de blocs avant le tirage
    /// @param _commitHash Hash d'engagement pour la sécurité du tirage
    constructor(
        uint256[] memory _participantIds,
        uint256 _blocksUntilDraw,
        bytes32 _commitHash
    ) {
        require(_participantIds.length >= MIN_PARTICIPANTS, 
            "Need at least 3 participants");
        require(_participantIds.length <= MAX_PARTICIPANTS, 
            "Too many participants");
        require(_blocksUntilDraw > 0, 
            "Blocks until draw must be > 0");
        require(_commitHash != bytes32(0), 
            "Commit hash cannot be zero");
        
        participantIds = _participantIds;
        BLOCKS_UNTIL_DRAW = _blocksUntilDraw;
        deploymentBlock = block.number;
        targetBlock = block.number + _blocksUntilDraw;
        commitHash = _commitHash;
        authorizedDrawers[msg.sender] = true;
        
        emit DrawingInitiated(targetBlock, _participantIds.length);
        emit DrawerAuthorized(msg.sender);
        emit CommitHashSet(_commitHash);
    }

    /// @notice Modifier pour vérifier si l'appelant est autorisé
    modifier onlyAuthorizedDrawer() {
        require(authorizedDrawers[msg.sender], "Not authorized to draw");
        _;
    }

    /// @notice Ajoute un tireur autorisé
    /// @param drawer Adresse à autoriser
    function addAuthorizedDrawer(address drawer) external onlyOwner {
        require(drawer != address(0), "Invalid address");
        require(!authorizedDrawers[drawer], "Already authorized");
        
        authorizedDrawers[drawer] = true;
        emit DrawerAuthorized(drawer);
    }

    /// @notice Révoque un tireur autorisé
    /// @param drawer Adresse à révoquer
    function revokeAuthorizedDrawer(address drawer) external onlyOwner {
        require(authorizedDrawers[drawer], "Not authorized");
        require(drawer != owner(), "Cannot revoke owner");
        
        authorizedDrawers[drawer] = false;
        emit DrawerRevoked(drawer);
    }

    /// @notice Exécute le tirage au sort
    /// @param reveal Valeur de révélation pour le commit
    function requestDrawing(bytes32 reveal) external 
        whenNotPaused 
        onlyAuthorizedDrawer 
        nonReentrant 
    {
        require(block.number >= targetBlock, "Too early for drawing");
        require(!isDrawingComplete, "Drawing already complete");
        require(keccak256(abi.encodePacked(reveal)) == commitHash, 
            "Invalid reveal value");

        // Génération du seed aléatoire
        bytes32 randomSeed = keccak256(
            abi.encodePacked(
                blockhash(block.number - 1),
                block.timestamp,
                block.prevrandao,
                participantIds,
                reveal,
                msg.sender
            )
        );

        // Sélection des gagnants
        uint256[3] memory winners = selectWinners(randomSeed);

        // Stockage des résultats
        result = DrawingResult({
            winnerIds: winners,
            randomSeed: randomSeed,
            drawBlock: block.number,
            commitReveal: reveal
        });

        isDrawingComplete = true;
        emit WinnersSelected(winners, randomSeed, reveal);
    }

    /// @notice Sélectionne les gagnants de manière aléatoire
    /// @param seed Seed pour la génération aléatoire
    /// @return tableau des IDs gagnants
    function selectWinners(bytes32 seed) private view returns (uint256[3] memory) {
        uint256[3] memory selectedWinners;
        uint256[] memory indexes = new uint256[](participantIds.length);
        
        // Initialisation des index
        for(uint i = 0; i < participantIds.length; i++) {
            indexes[i] = i;
        }

        // Sélection des gagnants (Fisher-Yates shuffle modifié)
        for(uint i = 0; i < 3; i++) {
            uint256 remainingParticipants = participantIds.length - i;
            uint256 randomIndex = uint256(
                keccak256(
                    abi.encodePacked(seed, i)
                )
            ) % remainingParticipants;

            selectedWinners[i] = participantIds[indexes[randomIndex]];
            indexes[randomIndex] = indexes[remainingParticipants - 1];
        }

        return selectedWinners;
    }

    /// @notice Récupère la liste des participants
    function getParticipantIds() external view returns (uint256[] memory) {
        return participantIds;
    }

    /// @notice Récupère les IDs des gagnants
    function getWinnerIds() external view returns (uint256[3] memory) {
        require(isDrawingComplete, "Drawing not complete yet");
        return result.winnerIds;
    }

    /// @notice Vérifie si un tirage peut être effectué
    function canDraw() external view returns (bool) {
        return block.number >= targetBlock && !isDrawingComplete && !paused();
    }

    /// @notice Récupère le nombre de blocs configuré pour le tirage
    /// @return Le nombre de blocs entre le déploiement et le tirage
    function getBlocksUntilDraw() external view returns (uint256) {
        return BLOCKS_UNTIL_DRAW;
    }

    /// @notice Pause le contrat
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Reprend le contrat
    function unpause() external onlyOwner {
        _unpause();
    }
}