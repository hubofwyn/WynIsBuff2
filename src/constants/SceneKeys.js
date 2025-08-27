/*
 * Central source of truth for Phaser Scene keys used throughout the game.
 * Having them in a single enum-like object avoids string typos and eases
 * refactors or renames.
 */

export const SceneKeys = Object.freeze({
  BOOT: 'Boot',
  PRELOADER: 'Preloader',
  WELCOME: 'Welcome',
  CHARACTER_SELECT: 'CharacterSelect',
  MAIN_MENU: 'MainMenu',
  GAME: 'Game',
  PAUSE: 'PauseScene',
  SETTINGS: 'Settings',
  GAME_OVER: 'GameOver',
  BIRTHDAY_MINIGAME: 'BirthdayMinigame',
  
  // Idle/Automation System Scenes
  HUB: 'HubScene',
  RUN: 'RunScene',
  RESULTS: 'ResultsScene',
  FACTORY: 'FactoryScene',
  UPGRADES: 'UpgradesScene',
  PRESTIGE: 'PrestigeScene',
});

// Optional: backwards-compat map so legacy code using literal strings can turn
// them into enum keys if needed.
export const SceneKeyLookup = Object.freeze(
  Object.fromEntries(Object.values(SceneKeys).map((v) => [v, v])),
);

