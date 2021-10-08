import { DestinyProfileResponse } from "bungie-api-ts/destiny2";

import { get } from "./bungieApi";
import { getAccessToken } from "./bungieApi/auth";

import collectProgressions from "./collectors/progressions";
import collectDestinyMetrics from "./collectors/metrics";
import collectKillTrackers from "./collectors/killTrackers";
import collectProfileLevels from "./collectors/profileLevels";

const { DESTINY_MEMBERSHIP_TYPE, DESTINY_MEMBERSHIP_ID } = process.env;

if (!DESTINY_MEMBERSHIP_TYPE)
  throw new Error(
    "DESTINY_MEMBERSHIP_TYPE environment variable must be defined. See README.md"
  );
if (!DESTINY_MEMBERSHIP_ID)
  throw new Error(
    "DESTINY_MEMBERSHIP_ID environment variable must be defined. See README.md"
  );

export default async function collectMetrics() {
  const mType = DESTINY_MEMBERSHIP_TYPE;
  const mID = DESTINY_MEMBERSHIP_ID;

  if (!mType || !mID) {
    throw new Error("Destiny membership type and ID should be defined");
  }

  const accessToken = await getAccessToken();
  const profile = await get<DestinyProfileResponse>(
    `/Platform/Destiny2/${mType}/Profile/${mID}/?components=100,200,201,309,205,102,202,104,1100`,
    accessToken
  );

  collectKillTrackers(profile);
  await collectProfileLevels(profile);
  collectDestinyMetrics(profile);
  collectProgressions(profile);
}
