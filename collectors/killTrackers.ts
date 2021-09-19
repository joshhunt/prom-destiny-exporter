import {
  DestinyProfileResponse,
  DestinyObjectiveProgress,
} from "bungie-api-ts/destiny2";
import { Gauge } from "prom-client";
import { promWeaponPvEKillTracker, promWeaponPvPKillTracker } from "../metrics";

// Find these on data.destinysets.com with `item.plug.plugCategoryHash === 2947756142`
const PVE_KILL_TRACKERS = [905869860, 2240097604, 2302094943];
const PVP_KILL_TRACKERS = [38912240, 2285636663, 3244015567];

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

export default function collectKillTrackers(profile: DestinyProfileResponse) {
  for (const [itemInstanceID, item] of Object.entries(
    profile.itemComponents.plugObjectives.data ?? {}
  )) {
    for (const [plugHash, plugObjectives] of Object.entries(
      item.objectivesPerPlug
    )) {
      if (PVE_KILL_TRACKERS.includes(Number(plugHash))) {
        trackKillTracker(
          promWeaponPvEKillTracker,
          profile,
          plugObjectives,
          itemInstanceID
        );
      }

      if (PVP_KILL_TRACKERS.includes(Number(plugHash))) {
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
