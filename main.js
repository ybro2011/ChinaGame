// --- Game Data Structures ---
const initialKingdoms = [
  { id: "wei", name: "Wei Kingdom", color: "#4299e1", type: "ai", units: 10 },
  { id: "shu", name: "Shu Han Kingdom", color: "#48bb78", type: "player", units: 10 },
  { id: "wu", name: "Wu Kingdom", color: "#f56565", type: "ai", units: 10 },
];

// --- Ancient China Provinces (Three Kingdoms Era) ---
// Each territory has: id, name (English + Chinese), ownerId, strength, neighbors, grid position
const initialTerritories = [
  { id: "YZ", name: "Youzhou (幽州 Yōuzhōu)", ownerId: "wei", strength: 4, neighbors: ["BZ", "JZ"], grid: {row: 1, col: 2} },
  { id: "BZ", name: "Bingzhou (并州 Bìngzhōu)", ownerId: "wei", strength: 3, neighbors: ["YZ", "JZ", "SZ", "LZ"], grid: {row: 2, col: 1} },
  { id: "JZ", name: "Jizhou (冀州 Jìzhōu)", ownerId: "wei", strength: 4, neighbors: ["YZ", "BZ", "SZ", "YZ2", "QZ"], grid: {row: 2, col: 2} },
  { id: "QZ", name: "Qingzhou (青州 Qīngzhōu)", ownerId: "wei", strength: 3, neighbors: ["JZ", "YZ2", "XZ"], grid: {row: 2, col: 3} },
  { id: "YZ2", name: "Yanzhou (兗州 Yǎnzhōu)", ownerId: "neutral", strength: 4, neighbors: ["JZ", "QZ", "XZ", "YZ3", "SZ"], grid: {row: 3, col: 2} },
  { id: "XZ", name: "Xuzhou (徐州 Xúzhōu)", ownerId: "neutral", strength: 3, neighbors: ["QZ", "YZ2", "YZ3", "YGZ2"], grid: {row: 3, col: 3} },
  { id: "YZ3", name: "Yuzhou (豫州 Yùzhōu)", ownerId: "neutral", strength: 4, neighbors: ["YZ2", "XZ", "YGZ2", "JGZ", "SZ"], grid: {row: 4, col: 2} },
  { id: "SZ", name: "Sili (司隶 Sīlì)", ownerId: "neutral", strength: 5, neighbors: ["BZ", "JZ", "YZ2", "YZ3", "YGZ", "LZ"], grid: {row: 3, col: 1} },
  { id: "LZ", name: "Liangzhou (凉州 Liángzhōu)", ownerId: "shu", strength: 5, neighbors: ["BZ", "SZ", "YGZ"], grid: {row: 2, col: 0} },
  { id: "YGZ", name: "Yongzhou (雍州 Yōngzhōu)", ownerId: "shu", strength: 4, neighbors: ["LZ", "SZ", "YIZ"], grid: {row: 4, col: 0} },
  { id: "YIZ", name: "Yizhou (益州 Yìzhōu)", ownerId: "shu", strength: 4, neighbors: ["YGZ", "JGZ"], grid: {row: 5, col: 0} },
  { id: "JGZ", name: "Jingzhou (荆州 Jīngzhōu)", ownerId: "neutral", strength: 4, neighbors: ["YIZ", "YZ3", "YGZ2", "JAZ"], grid: {row: 5, col: 1} },
  { id: "YGZ2", name: "Yangzhou (扬州 Yángzhōu)", ownerId: "wu", strength: 3, neighbors: ["XZ", "YZ3", "JGZ", "GZ"], grid: {row: 5, col: 2} },
  { id: "JAZ", name: "Jiaozhou (交州 Jiāozhōu)", ownerId: "wu", strength: 3, neighbors: ["JGZ", "GZ"], grid: {row: 6, col: 1} },
  { id: "GZ", name: "Guangzhou (广州 Guǎngzhōu)", ownerId: "wu", strength: 3, neighbors: ["YGZ2", "JAZ"], grid: {row: 6, col: 2} },
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

// --- SVG Map Coloring and Interactivity ---
function colorSVGMap() {
  if (!document.getElementById('svg-map')) return;
  gameData.territories.forEach(territory => {
    const path = document.getElementById(territory.id);
    if (path) {
      let owner = getKingdomById(territory.ownerId);
      path.setAttribute('fill', owner ? owner.color : '#a0aec0');
      path.setAttribute('stroke', territory.id === gameData.selectedOwnedTerritoryId ? 'yellow' :
                                 territory.id === gameData.selectedTargetTerritoryId ? 'red' : '#222');
      path.setAttribute('stroke-width', territory.id === gameData.selectedOwnedTerritoryId || territory.id === gameData.selectedTargetTerritoryId ? 4 : 1);
      path.onclick = () => handleTerritoryClick(territory.id);
      path.style.cursor = 'pointer';
    }
  });
}

// --- Override renderMap to just color the SVG map ---
function renderMap() {
  colorSVGMap();
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