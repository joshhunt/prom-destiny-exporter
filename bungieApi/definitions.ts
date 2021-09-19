import {
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
} from "bungie-api-ts/destiny2";
import { get } from "./get";

const SEASON_DEFINITIONS: Record<string, DestinySeasonDefinition> = {};
const SEASON_PASS_DEFINITIONS: Record<string, DestinySeasonPassDefinition> = {};

export async function getSeasonDefinition(seasonHash: number) {
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

export async function getSeasonPassDefinition(seasonPassHash: number) {
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
