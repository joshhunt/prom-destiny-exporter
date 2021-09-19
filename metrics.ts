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
  name: "artifact_xp_next_level_at_xp",
  help: "XP to next seasonal artifact power bonus",
  labelNames: ["seasonHash"] as const,
});

export const promSeasonPassRank = new Gauge({
  name: "season_pass_rank",
  help: "Season pass rank",
  labelNames: ["seasonHash"] as const,
});
