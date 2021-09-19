import urlLib from "url";

import axios from "axios";
import { ServerResponse } from "bungie-api-ts/common";

const { BUNGIE_API_KEY } = process.env;

if (!BUNGIE_API_KEY)
  throw new Error(
    "BUNGIE_API_KEY environment variable must be defined. See README.md"
  );

const API_KEY = BUNGIE_API_KEY;

export async function get<TResponseType>(path: string, accessToken?: string) {
  const baseUrl = `https://www.bungie.net${path}`;
  const parsedUrl = new urlLib.URL(baseUrl);
  parsedUrl.searchParams.set("_bust", Math.random().toString());

  const url = parsedUrl.toString();
  console.log("Calling API", url);

  const headers: Record<string, string> = {
    "x-api-key": API_KEY,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const resp = await axios.get<ServerResponse<TResponseType>>(url, {
    headers,
  });

  return resp.data.Response;
}
