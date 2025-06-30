// --- Game Data Structures ---
const initialKingdoms = [
  { id: "wei", name: "Wei Kingdom", color: "#4299e1", type: "ai", units: 10 },
  { id: "shu", name: "Shu Han Kingdom", color: "#48bb78", type: "player", units: 10 },
  { id: "wu", name: "Wu Kingdom", color: "#f56565", type: "ai", units: 10 },
];

// --- Original 9-territory map ---
const initialTerritories = [
  { id: "T1", name: "Northern Plains", ownerId: "wei", strength: 4, neighbors: ["T2", "T4"] },
  { id: "T2", name: "Central Hills", ownerId: "wei", strength: 3, neighbors: ["T1", "T3", "T5"] },
  { id: "T3", name: "Eastern Coast", ownerId: "wei", strength: 4, neighbors: ["T2", "T6"] },
  { id: "T4", name: "Western Mountains", ownerId: "shu", strength: 5, neighbors: ["T1", "T5", "T7"] },
  { id: "T5", name: "Heartland", ownerId: "neutral", strength: 3, neighbors: ["T2", "T4", "T6", "T8"] },
  { id: "T6", name: "Southern Coast", ownerId: "wu", strength: 4, neighbors: ["T3", "T5", "T9"] },
  { id: "T7", name: "Southwest Jungles", ownerId: "shu", strength: 4, neighbors: ["T4", "T8"] },
  { id: "T8", name: "Central River", ownerId: "neutral", strength: 3, neighbors: ["T5", "T7", "T9"] },
  { id: "T9", name: "Southeast Delta", ownerId: "wu", strength: 5, neighbors: ["T6", "T8"] }
];

// --- Global Game State ---
let gameData = {
  kingdoms: [],
  territories: [],
  currentPlayerId: null,
  turnCount: 1,
  maxTurns: 20,
  selectedOwnedTerritoryId: null,
  selectedTargetTerritoryId: null,
  playerKingdomId: null,
  gameOver: false
};

// --- Game Logic Functions ---

// Initialize the game
function initGame() {
  // Show the kingdom selection modal
  const modal = document.getElementById('kingdom-select-modal');
  modal.classList.remove('hidden');

  // Set up button listeners (only once)
  document.getElementById('choose-wei').onclick = () => selectKingdom('wei');
  document.getElementById('choose-shu').onclick = () => selectKingdom('shu');
  document.getElementById('choose-wu').onclick = () => selectKingdom('wu');
}

// Handle kingdom selection
function selectKingdom(kingdomId) {
  // Set up game data
  gameData.kingdoms = JSON.parse(JSON.stringify(initialKingdoms));
  gameData.territories = JSON.parse(JSON.stringify(initialTerritories));
  gameData.playerKingdomId = kingdomId;
  gameData.currentPlayerId = kingdomId;
  gameData.turnCount = 1;
  gameData.selectedOwnedTerritoryId = null;
  gameData.selectedTargetTerritoryId = null;

  // Set player/ai types
  gameData.kingdoms.forEach(k => {
    k.type = (k.id === kingdomId) ? 'player' : 'ai';
  });

  // Hide the modal
  document.getElementById('kingdom-select-modal').classList.add('hidden');

  // Render map and info panel
  renderMap();
  updateInfoPanel();
  addGameLog(`You have chosen the ${getKingdomById(kingdomId).name}. The game begins!`);
}

// Utility to get kingdom by id
function getKingdomById(id) {
  return gameData.kingdoms.find(k => k.id === id);
}

// Render the map UI for the 9-territory grid map
function renderMap() {
  const map = document.getElementById('game-map');
  map.innerHTML = '';

  // 3x3 grid
  const gridOrder = [
    ["T1", "T2", "T3"],
    ["T4", "T5", "T6"],
    ["T7", "T8", "T9"]
  ];

  // Determine attackable neighbors if a player-owned territory is selected
  let attackableIds = [];
  if (gameData.selectedOwnedTerritoryId) {
    const owned = gameData.territories.find(t => t.id === gameData.selectedOwnedTerritoryId);
    attackableIds = owned.neighbors
      .map(nid => gameData.territories.find(t => t.id === nid))
      .filter(t => t.ownerId !== gameData.playerKingdomId)
      .map(t => t.id);
  }

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const tid = gridOrder[row][col];
      const territory = gameData.territories.find(t => t.id === tid);
      if (territory) {
        // Determine owner and color
        let owner = getKingdomById(territory.ownerId);
        let bgColor = owner ? owner.color : '#a0aec0';
        let textColor = 'text-white';
        if (!owner) textColor = 'text-gray-800';

        // Highlight if selected or attackable
        let border = '';
        let extraStyle = '';
        let clickable = false;
        if (territory.id === gameData.selectedOwnedTerritoryId) {
          border = 'ring-4 ring-yellow-400';
          clickable = true;
        } else if (territory.id === gameData.selectedTargetTerritoryId) {
          border = 'ring-4 ring-red-400';
        } else if (attackableIds.includes(territory.id)) {
          border = 'ring-4 ring-blue-400';
          clickable = true;
        } else if (territory.ownerId === gameData.playerKingdomId && !gameData.selectedOwnedTerritoryId) {
          clickable = true;
        } else if (gameData.selectedOwnedTerritoryId) {
          extraStyle = 'opacity-40 pointer-events-none';
        }

        // Create territory div
        const div = document.createElement('div');
        div.className = `rounded-lg shadow-md flex flex-col items-center justify-center p-4 h-28 text-base ${textColor} ${border} ${extraStyle}`;
        div.style.background = bgColor;
        div.innerHTML = `<div class=\"font-bold text-center\">${territory.name}</div><div>Strength: ${territory.strength}</div>`;
        if (clickable && gameData.currentPlayerId === gameData.playerKingdomId) {
          div.classList.add('cursor-pointer');
          div.onclick = () => handleTerritoryClick(territory.id);
        } else {
          div.classList.remove('cursor-pointer');
          div.onclick = null;
        }
        map.appendChild(div);
      } else {
        // Empty cell
        const div = document.createElement('div');
        map.appendChild(div);
      }
    }
  }
  renderControlPanel();
}

// Update the info panel UI
function updateInfoPanel() {
  const panel = document.getElementById('info-panel');
  if (!gameData.kingdoms.length) {
    panel.innerHTML = '';
    return;
  }

  // Current turn
  let turnInfo = `<div class="font-bold">Turn ${gameData.turnCount} of ${gameData.maxTurns}</div>`;

  // Current player
  const currentKingdom = getKingdomById(gameData.currentPlayerId);
  let playerInfo = '';
  if (currentKingdom.id === gameData.playerKingdomId) {
    playerInfo = `<div class="text-green-700 font-semibold">Your Turn: ${currentKingdom.name}</div>`;
  } else {
    playerInfo = `<div class="text-blue-700 font-semibold">AI Turn: ${currentKingdom.name}</div>`;
  }

  // Your units
  const playerKingdom = getKingdomById(gameData.playerKingdomId);
  let unitsInfo = `<div class="">Units Available: <span class="font-bold">${playerKingdom.units}</span></div>`;

  // Kingdom status table
  let statusTable = `<div class="mt-2"><div class="font-semibold mb-1">Kingdom Status</div><table class="w-full text-sm"><thead><tr><th class="text-left">Kingdom</th><th>Territories</th><th>Strength</th></tr></thead><tbody>`;
  gameData.kingdoms.forEach(k => {
    const terrCount = gameData.territories.filter(t => t.ownerId === k.id).length;
    const totalStrength = gameData.territories.filter(t => t.ownerId === k.id).reduce((sum, t) => sum + t.strength, 0);
    statusTable += `<tr><td class="font-bold" style="color:${k.color}">${k.name}</td><td class="text-center">${terrCount}</td><td class="text-center">${totalStrength}</td></tr>`;
  });
  statusTable += '</tbody></table></div>';

  panel.innerHTML = `${turnInfo}${playerInfo}${unitsInfo}${statusTable}`;

  renderControlPanel();
}

// Handle territory click events
function handleTerritoryClick(territoryId) {
  // Only allow on player's turn
  if (gameData.currentPlayerId !== gameData.playerKingdomId) return;

  const territory = gameData.territories.find(t => t.id === territoryId);
  if (!territory) return;

  // If clicking your own territory, select it
  if (territory.ownerId === gameData.playerKingdomId) {
    gameData.selectedOwnedTerritoryId = territoryId;
    gameData.selectedTargetTerritoryId = null;
  } else if (gameData.selectedOwnedTerritoryId) {
    // If you have a territory selected, check if this is an adjacent enemy/neutral territory
    const owned = gameData.territories.find(t => t.id === gameData.selectedOwnedTerritoryId);
    if (owned.neighbors.includes(territoryId) && territory.ownerId !== gameData.playerKingdomId) {
      gameData.selectedTargetTerritoryId = territoryId;
    }
  }

  renderMap();
  updateInfoPanel();
}

// Handle reinforce action
function handleReinforce() {
  // Only allow if a player-owned territory is selected and enough units
  const terrId = gameData.selectedOwnedTerritoryId;
  if (!terrId) return;
  const player = getKingdomById(gameData.playerKingdomId);
  if (player.units < 2) {
    addGameLog('Not enough units to reinforce (need 2).');
    return;
  }
  const territory = gameData.territories.find(t => t.id === terrId);
  if (territory.ownerId !== gameData.playerKingdomId) return;

  // Spend 2 units for +1 strength
  player.units -= 2;
  territory.strength += 1;
  addGameLog(`You reinforced ${territory.name} (+1 strength, -2 units).`);

  renderMap();
  updateInfoPanel();
}

// Handle attack action
function handleAttack() {
  // Only allow if both a player-owned and a target territory are selected
  const ownedId = gameData.selectedOwnedTerritoryId;
  const targetId = gameData.selectedTargetTerritoryId;
  if (!ownedId || !targetId) return;
  const player = getKingdomById(gameData.playerKingdomId);
  if (player.units < 1) {
    addGameLog('Not enough units to attack.');
    return;
  }
  const owned = gameData.territories.find(t => t.id === ownedId);
  const target = gameData.territories.find(t => t.id === targetId);
  if (!owned.neighbors.includes(targetId)) return;
  if (owned.ownerId !== gameData.playerKingdomId) return;
  if (target.ownerId === gameData.playerKingdomId) return;

  // Combat logic
  const attackerPower = player.units + owned.strength;
  const defenderPower = target.strength;

  if (attackerPower > defenderPower) {
    // Conquer territory
    target.ownerId = gameData.playerKingdomId;
    // Reduce player's units by 50% of committed units (rounded up)
    const lostUnits = Math.ceil(player.units * 0.5);
    player.units -= lostUnits;
    if (player.units < 0) player.units = 0;
    addGameLog(`You conquered ${target.name}! (-${lostUnits} units)`);
  } else {
    // Attack failed
    addGameLog(`Your attack on ${target.name} failed! (lost all committed units)`);
    player.units = 0;
    // Reduce strength of owned territory by 1 (min 1)
    owned.strength = Math.max(1, owned.strength - 1);
  }

  // Reset selections
  gameData.selectedOwnedTerritoryId = null;
  gameData.selectedTargetTerritoryId = null;

  renderMap();
  updateInfoPanel();
}

// End the player's turn
function endPlayerTurn() {
  // Reset selections
  gameData.selectedOwnedTerritoryId = null;
  gameData.selectedTargetTerritoryId = null;
  renderMap();
  updateInfoPanel();
  // Start AI turns
  runAITurns();
}

// Run AI turns (with delay)
function runAITurns() {
  const aiKingdoms = gameData.kingdoms.filter(k => k.type === 'ai');
  let aiIndex = 0;

  function doNextAI() {
    if (aiIndex >= aiKingdoms.length) {
      // All AI done, next turn
      gameData.turnCount++;
      checkGameOver();
      if (!gameData.gameOver) {
        gameData.currentPlayerId = gameData.playerKingdomId;
        renderMap();
        updateInfoPanel();
        addGameLog('Your turn!');
      }
      return;
    }
    const ai = aiKingdoms[aiIndex];
    gameData.currentPlayerId = ai.id;
    renderMap();
    updateInfoPanel();

    // AI: gain units
    ai.units += 2;
    addGameLog(`${ai.name} gains 2 units.`);

    // AI: reinforce random owned territory if possible
    const aiTerrs = gameData.territories.filter(t => t.ownerId === ai.id);
    if (ai.units >= 2 && aiTerrs.length > 0) {
      const reinforceTerr = aiTerrs[Math.floor(Math.random() * aiTerrs.length)];
      ai.units -= 2;
      reinforceTerr.strength += 1;
      addGameLog(`${ai.name} reinforced ${reinforceTerr.name}.`);
    }

    // AI: try to attack weakest adjacent enemy/neutral territory
    let didAttack = false;
    for (const terr of aiTerrs) {
      // Find adjacent enemy/neutral territories
      const targets = terr.neighbors
        .map(nid => gameData.territories.find(t => t.id === nid))
        .filter(t => t.ownerId !== ai.id);
      if (targets.length > 0) {
        // Pick weakest
        const target = targets.reduce((a, b) => (a.strength < b.strength ? a : b));
        // AI commits 5 units or as many as it has
        const commitUnits = Math.min(5, ai.units);
        const attackerPower = commitUnits + terr.strength;
        const defenderPower = target.strength;
        if (commitUnits > 0 && attackerPower > defenderPower) {
          // Conquer
          target.ownerId = ai.id;
          ai.units -= commitUnits;
          addGameLog(`${ai.name} attacked and conquered ${target.name}!`);
        } else if (commitUnits > 0) {
          // Failed attack
          ai.units -= commitUnits;
          terr.strength = Math.max(1, terr.strength - 1);
          addGameLog(`${ai.name} attacked ${target.name} but failed.`);
        }
        didAttack = true;
        break; // Only one attack per AI per turn
      }
    }
    setTimeout(() => {
      aiIndex++;
      doNextAI();
    }, 1000);
  }
  doNextAI();
}

// Check if the game is over
function checkGameOver() {
  // Check if only one kingdom remains
  const aliveKingdoms = gameData.kingdoms.filter(k =>
    gameData.territories.some(t => t.ownerId === k.id)
  );
  let winner = null;
  let reason = '';
  if (aliveKingdoms.length === 1) {
    winner = aliveKingdoms[0];
    reason = 'last kingdom standing';
  } else if (gameData.turnCount > gameData.maxTurns) {
    // Max turns reached: winner is kingdom with most territories
    let maxTerr = 0;
    let winners = [];
    gameData.kingdoms.forEach(k => {
      const terrCount = gameData.territories.filter(t => t.ownerId === k.id).length;
      if (terrCount > maxTerr) {
        maxTerr = terrCount;
        winners = [k];
      } else if (terrCount === maxTerr) {
        winners.push(k);
      }
    });
    if (winners.length === 1) {
      winner = winners[0];
      reason = 'most territories after max turns';
    } else {
      winner = null;
      reason = 'tie after max turns';
    }
  }

  if (winner || reason === 'tie after max turns') {
    gameData.gameOver = true;
    const modal = document.getElementById('game-over-modal');
    const msg = document.getElementById('game-over-message');
    if (winner) {
      msg.innerHTML = `<span style="color:${winner.color}">${winner.name}</span> wins by ${reason}!`;
    } else {
      msg.innerHTML = `It's a tie! (${reason})`;
    }
    modal.classList.remove('hidden');
    // Disable controls
    document.getElementById('control-panel').innerHTML = '';
  }
}

// Utility: Add message to game log
function addGameLog(message) {
  const log = document.getElementById('game-log');
  log.innerHTML += `<div>${message}</div>`;
  log.scrollTop = log.scrollHeight;
}

// Render control panel
function renderControlPanel() {
  const panel = document.getElementById('control-panel');
  // Only show controls on player's turn
  if (gameData.currentPlayerId !== gameData.playerKingdomId) {
    panel.innerHTML = '<div class="text-gray-500">Waiting for AI...</div>';
    return;
  }

  // Determine button states
  const canReinforce = !!gameData.selectedOwnedTerritoryId;
  const canAttack = !!gameData.selectedOwnedTerritoryId && !!gameData.selectedTargetTerritoryId;

  panel.innerHTML = `
    <button id="btn-reinforce" class="px-4 py-2 rounded bg-yellow-500 text-white font-semibold shadow hover:bg-yellow-600 disabled:opacity-50" ${canReinforce ? '' : 'disabled'}>Reinforce Territory</button>
    <button id="btn-attack" class="px-4 py-2 rounded bg-red-500 text-white font-semibold shadow hover:bg-red-600 disabled:opacity-50" ${canAttack ? '' : 'disabled'}>Attack Territory</button>
    <button id="btn-end-turn" class="px-4 py-2 rounded bg-gray-700 text-white font-semibold shadow hover:bg-gray-900">End Turn</button>
  `;

  // Add event listeners
  document.getElementById('btn-reinforce').onclick = handleReinforce;
  document.getElementById('btn-attack').onclick = handleAttack;
  document.getElementById('btn-end-turn').onclick = endPlayerTurn;
}

// --- Event Listeners for Control Panel and Modal ---
// TODO: Add event listeners for reinforce, attack, end turn, and restart buttons

// --- Start the Game ---
window.onload = function() {
  // Modal restart button
  document.getElementById('btn-restart').onclick = function() {
    document.getElementById('game-over-modal').classList.add('hidden');
    // Reset game state
    gameData = {
      kingdoms: [],
      territories: [],
      currentPlayerId: null,
      turnCount: 1,
      maxTurns: 20,
      selectedOwnedTerritoryId: null,
      selectedTargetTerritoryId: null,
      playerKingdomId: null,
      gameOver: false
    };
    // Show kingdom select modal
    document.getElementById('kingdom-select-modal').classList.remove('hidden');
    // Re-init
    initGame();
  };
  // Initial game start
  initGame();
} 