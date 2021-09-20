import axios from "axios";
import lodash from "lodash";
import fsExtra from "fs-extra";
import buffer from "buffer";
import {
  DestinyProfileResponse,
  DestinyObjectiveProgress,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
  DestinyProgression,
} from "bungie-api-ts/destiny2";
import {
  promArtifactNextLevelAtXP,
  promArtifactPowerBonus,
  promArtifactProgressToNextLevelXP,
  promArtifactXP,
  promMetricProgress,
  promSeasonPassRank,
  promWeaponPvEKillTracker,
  promWeaponPvPKillTracker,
  promProgressionCurrentProgress,
  promProgressionLevel,
  promProgressionProgressToNextLevel,
  promProgressionNextLevelAt,
  promProgressionCurrentResetCount,
} from "./metrics";
import { Gauge } from "prom-client";
import { get } from "./bungieApi";
import { verify } from "crypto";

const authSettings = {
  client_id: "35204",
  client_secret: "CkTxOLoLLN9g4R0K7zqdM5oKpy59KAa4defJxg63caE",
};

// item.plug.plugCategoryHash === 2947756142
const pveKillTrackers = [905869860, 2240097604, 2302094943];
const pvpKillTrackers = [38912240, 2285636663, 3244015567];

async function getAccessToken() {
  const auth = await fsExtra.readJSON("./auth.json");
  const authTokenExpiration = auth.authTokenExpiration
    ? new Date(auth.authTokenExpiration)
    : new Date(2000, 1);

  const refreshTokenExpiration = auth.refreshTokenExpiration
    ? new Date(auth.refreshTokenExpiration)
    : new Date(2100, 1);

  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);

  if (authTokenExpiration > now) {
    return auth.access_token;
  }

  if (refreshTokenExpiration < now) {
    throw new Error("Refresh token has expired");
  }

  const b64 = buffer.Buffer.from(
    `${authSettings.client_id}:${authSettings.client_secret}`
  ).toString("base64");

  const resp = await axios.post(
    "https://www.bungie.net/Platform/App/OAuth/Token/",
    `grant_type=refresh_token&refresh_token=${auth.refresh_token}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${b64}`,
      },
    }
  );

  if (!resp.data.access_token) {
    throw new Error("Could not refresh access token");
  }

  console.log("Refreshing access token");

  const newAuthData = {
    ...resp.data,
  };

  const newAuthTokenExpiration = new Date();
  newAuthTokenExpiration.setSeconds(
    newAuthTokenExpiration.getSeconds() + newAuthData.expires_in
  );

  const newRefreshTokenExpiration = new Date();
  newRefreshTokenExpiration.setSeconds(
    newRefreshTokenExpiration.getSeconds() + newAuthData.refresh_expires_in
  );

  newAuthData.authTokenExpiration = newAuthTokenExpiration;
  newAuthData.refreshTokenExpiration = newRefreshTokenExpiration;

  await fsExtra.writeJSON("./auth.json", newAuthData);

  return newAuthData.access_token;
}

function itemHashforInstanceID(
  itemInstanceID: string,
  profile: DestinyProfileResponse
) {
  for (const { items } of Object.values(
    profile.characterInventories.data ?? {}
  )) {
    for (const item of items) {
      if (item.itemInstanceId === itemInstanceID) {
        return item.itemHash;
      }
    }
  }

  for (const { items } of Object.values(
    profile.characterEquipment.data ?? {}
  )) {
    for (const item of items) {
      if (item.itemInstanceId === itemInstanceID) {
        return item.itemHash;
      }
    }
  }

  for (const item of profile.profileInventory.data?.items ?? []) {
    if (item.itemInstanceId === itemInstanceID) {
      return item.itemHash;
    }
  }
}

function trackKillTracker(
  metric: Gauge<"itemHash" | "itemInstanceID">,
  profile: DestinyProfileResponse,
  plugObjectives: DestinyObjectiveProgress[],
  itemInstanceID: string
) {
  const value = plugObjectives[0].progress;
  if (!value && value !== 0) {
    return;
  }

  const itemHash = itemHashforInstanceID(itemInstanceID, profile);

  metric
    .labels({
      itemHash: itemHash,
      itemInstanceID: itemInstanceID,
    })
    .set(value);
}

function collectKillTrackers(profile: DestinyProfileResponse) {
  for (const [itemInstanceID, item] of Object.entries(
    profile.itemComponents.plugObjectives.data ?? {}
  )) {
    for (const [plugHash, plugObjectives] of Object.entries(
      item.objectivesPerPlug
    )) {
      if (pveKillTrackers.includes(Number(plugHash))) {
        trackKillTracker(
          promWeaponPvEKillTracker,
          profile,
          plugObjectives,
          itemInstanceID
        );
      }

      if (pvpKillTrackers.includes(Number(plugHash))) {
        trackKillTracker(
          promWeaponPvPKillTracker,
          profile,
          plugObjectives,
          itemInstanceID
        );
      }
    }
  }
}

const SEASON_DEFINITIONS: Record<string, DestinySeasonDefinition> = {};
const SEASON_PASS_DEFINITIONS: Record<string, DestinySeasonPassDefinition> = {};

async function getSeasonDefinition(seasonHash: number) {
  let def = SEASON_DEFINITIONS[seasonHash];
  if (!def) {
    console.log("Fetching Season definition", seasonHash);
    def = await get<DestinySeasonDefinition>(
      `/Platform/Destiny2/Manifest/DestinySeasonDefinition/${seasonHash}/`
    );
    SEASON_DEFINITIONS[seasonHash] = def;
  }

  return def;
}

async function getSeasonPassDefinition(seasonPassHash: number) {
  let def = SEASON_PASS_DEFINITIONS[seasonPassHash];
  if (!def) {
    console.log("Fetching Season Pass definition", seasonPassHash);
    def = await get<DestinySeasonPassDefinition>(
      `/Platform/Destiny2/Manifest/DestinySeasonPassDefinition/${seasonPassHash}/`
    );
    SEASON_PASS_DEFINITIONS[seasonPassHash] = def;
  }

  return def;
}

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

async function collectProfileLevels(profile: DestinyProfileResponse) {
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

function collectDestinyMetrics(profile: DestinyProfileResponse) {
  for (const [metricHash, destinyMetric] of Object.entries(
    profile.metrics?.data?.metrics ?? {}
  )) {
    promMetricProgress
      .labels({ metricHash })
      .set(destinyMetric.objectiveProgress.progress ?? 0);
  }
}

interface ScopedProgression {
  characterID: string;
  progression: DestinyProgression;
}

function collectProgressions(profile: DestinyProfileResponse) {
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

export default async function collectMetrics() {
  const accessToken = await getAccessToken();
  const profile = await get<DestinyProfileResponse>(
    `/Platform/Destiny2/2/Profile/4611686018469271298/?components=100,200,201,309,205,102,202,104,1100`,
    accessToken
  );

  collectKillTrackers(profile);
  await collectProfileLevels(profile);
  collectDestinyMetrics(profile);
  collectProgressions(profile);
}
