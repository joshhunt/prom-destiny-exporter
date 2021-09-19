import { DestinyProfileResponse } from "bungie-api-ts/destiny2";
import { getSeasonDefinition, getSeasonPassDefinition } from "../bungieApi";
import {
  promArtifactNextLevelAtXP,
  promArtifactPowerBonus,
  promArtifactProgressToNextLevelXP,
  promArtifactXP,
  promSeasonPassRank,
} from "../metrics";

async function getSeasonPassRank(
  seasonHash: number,
  profile: DestinyProfileResponse
) {
  const seasonDef = await getSeasonDefinition(seasonHash);
  const seasonPassDef = await getSeasonPassDefinition(
    seasonDef.seasonPassHash ?? 0
  );

  const { rewardProgressionHash, prestigeProgressionHash } = seasonPassDef;
  const progressions = Object.values(
    profile.characterProgressions.data ?? {}
  ).flatMap((v) => Object.values(v.progressions));

  const rewardProgression = progressions.find(
    (v) => v.progressionHash === rewardProgressionHash
  );
  const prestigeProgression = progressions.find(
    (v) => v.progressionHash === prestigeProgressionHash
  );

  const seasonPassRank =
    (rewardProgression?.level ?? 0) + (prestigeProgression?.level ?? 0);

  return seasonPassRank;
}

export default async function collectProfileLevels(
  profile: DestinyProfileResponse
) {
  const seasonHash = profile.profile.data?.currentSeasonHash;

  if (!seasonHash) {
    console.error("Could not get season hash from profile");
    return;
  }

  const seasonPassRank = await getSeasonPassRank(seasonHash, profile);
  const seasonalPowerBonus =
    profile.profileProgression.data?.seasonalArtifact.powerBonus ?? 0;
  const seasonalXp =
    profile.profileProgression.data?.seasonalArtifact.powerBonusProgression
      .currentProgress ?? 0;
  const nextLevelAtXP =
    profile.profileProgression.data?.seasonalArtifact.powerBonusProgression
      .nextLevelAt ?? 0;
  const progressToNextLevel =
    profile.profileProgression.data?.seasonalArtifact.powerBonusProgression
      .progressToNextLevel ?? 0;

  promSeasonPassRank.labels({ seasonHash }).set(seasonPassRank);
  promArtifactPowerBonus.labels({ seasonHash }).set(seasonalPowerBonus);
  promArtifactXP.labels({ seasonHash }).set(seasonalXp);

  promArtifactNextLevelAtXP.labels({ seasonHash }).set(nextLevelAtXP);
  promArtifactProgressToNextLevelXP
    .labels({ seasonHash })
    .set(progressToNextLevel);
}
