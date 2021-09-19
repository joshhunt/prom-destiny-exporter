import axios from "axios";
import urlLib from "url";
import { ServerResponse } from "bungie-api-ts/common";

const BUNGIE_API_KEY = "400814fe6f914295ab4b8317d8e64d57";

export async function get<TResponseType>(path: string, accessToken?: string) {
  const baseUrl = `https://www.bungie.net${path}`;
  const parsedUrl = new urlLib.URL(baseUrl);
  parsedUrl.searchParams.set("_bust", Math.random().toString());

  const url = parsedUrl.toString();
  console.log("Calling API", url);

  const headers: Record<string, string> = {
    "x-api-key": BUNGIE_API_KEY,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const resp = await axios.get<ServerResponse<TResponseType>>(url, {
    headers,
  });

  return resp.data.Response;
}
