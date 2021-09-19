import { DestinyProfileResponse } from "bungie-api-ts/destiny2";

import { get } from "./bungieApi";
import { getAccessToken } from "./bungieApi/auth";

import collectProgressions from "./collectors/progressions";
import collectDestinyMetrics from "./collectors/metrics";
import collectKillTrackers from "./collectors/killTrackers";
import collectProfileLevels from "./collectors/profileLevels";

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
