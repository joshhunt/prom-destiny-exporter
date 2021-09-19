import {
  DestinyProfileResponse,
  DestinyProgression,
} from "bungie-api-ts/destiny2";
import lodash from "lodash";

import {
  promProgressionCurrentProgress,
  promProgressionCurrentResetCount,
  promProgressionLevel,
  promProgressionNextLevelAt,
  promProgressionProgressToNextLevel,
} from "../metrics";

interface ScopedProgression {
  characterID: string;
  progression: DestinyProgression;
}

export default function collectProgressions(profile: DestinyProfileResponse) {
  const allProgressions = Object.entries(
    profile.characterProgressions.data ?? {}
  ).flatMap(([characterID, data]) =>
    Object.values(data.progressions).map((progression) => ({
      characterID,
      progression,
    }))
  );

  const progressionsToTrack = lodash(allProgressions)
    .groupBy((v) => v.progression.progressionHash)
    .flatMap<ScopedProgression>((progressions) => {
      const firstProgression = progressions[0].progression;
      const allTheSameProgression = progressions.every(
        (v) =>
          v.progression.currentProgress === firstProgression.currentProgress &&
          v.progression.level === firstProgression.level &&
          v.progression.currentResetCount === firstProgression.currentResetCount
      );

      const profileProgression = [
        {
          characterID: "0",
          progression: firstProgression,
        },
      ];

      if (allTheSameProgression) {
        return profileProgression;
      } else {
        return progressions;
      }
    })
    .value();

  for (const { characterID, progression } of progressionsToTrack) {
    const progressionHash = progression.progressionHash;
    promProgressionCurrentProgress
      .labels({ characterID, progressionHash })
      .set(progression.currentProgress);

    promProgressionLevel
      .labels({ characterID, progressionHash })
      .set(progression.level);

    promProgressionProgressToNextLevel
      .labels({ characterID, progressionHash })
      .set(progression.progressToNextLevel);

    promProgressionNextLevelAt
      .labels({ characterID, progressionHash })
      .set(progression.nextLevelAt);

    if (progression.hasOwnProperty("currentResetCount")) {
      promProgressionCurrentResetCount
        .labels({ characterID, progressionHash })
        .set(progression.currentResetCount ?? 0);
    }
  }
}
