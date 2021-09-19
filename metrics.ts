import { Gauge } from "prom-client";

export const promWeaponPvEKillTracker = new Gauge({
  name: "weapon_pve_kill_tracker",
  help: "Masterworked weapon PvE kill tracker",
  labelNames: ["itemHash", "itemInstanceID"] as const,
});

export const promWeaponPvPKillTracker = new Gauge({
  name: "weapon_pvp_kill_tracker",
  help: "Masterworked weapon PvP kill tracker",
  labelNames: ["itemHash", "itemInstanceID"] as const,
});

export const promArtifactPowerBonus = new Gauge({
  name: "artifact_power_bonus",
  help: "Seasonal artifact power bonus",
  labelNames: ["seasonHash"] as const,
});

export const promArtifactXP = new Gauge({
  name: "artifact_xp",
  help: "Seasonal artifact XP",
  labelNames: ["seasonHash"] as const,
});

export const promArtifactNextLevelAtXP = new Gauge({
  name: "artifact_next_level_at_xp",
  help: "XP to next seasonal artifact power bonus",
  labelNames: ["seasonHash"] as const,
});

export const promArtifactProgressToNextLevelXP = new Gauge({
  name: "artifact_progress_to_next_level_xp",
  help: "XP to next seasonal artifact power bonus",
  labelNames: ["seasonHash"] as const,
});

export const promSeasonPassRank = new Gauge({
  name: "season_pass_rank",
  help: "Season pass rank",
  labelNames: ["seasonHash"] as const,
});

export const promMetricProgress = new Gauge({
  name: "metric_progress",
  help: "Stat tracker metric progress",
  labelNames: ["metricHash"] as const,
});

export const promProgressionCurrentProgress = new Gauge({
  name: "progression_current_progress",
  help: "Progression current progress",
  labelNames: ["progressionHash", "characterID"],
});

export const promProgressionLevel = new Gauge({
  name: "progression_level",
  help: "Progression level",
  labelNames: ["progressionHash", "characterID"],
});

// export const promProgressionLevelCap = new Gauge({
//   name: "progression_level_cap",
//   help: "Progression level cap",
//   labelNames: ["progressionHash", "characterID"],
// });

export const promProgressionProgressToNextLevel = new Gauge({
  name: "progression_progress_to_next_level",
  help: "Progression progress to next level",
  labelNames: ["progressionHash", "characterID"],
});

export const promProgressionNextLevelAt = new Gauge({
  name: "progression_next_level_at",
  help: "Progression next level at",
  labelNames: ["progressionHash", "characterID"],
});

export const promProgressionCurrentResetCount = new Gauge({
  name: "progression_current_reset_count",
  help: "Progression current reset count",
  labelNames: ["progressionHash", "characterID"],
});
