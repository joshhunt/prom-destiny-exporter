import buffer from "buffer";

import axios from "axios";
import fsExtra from "fs-extra";

const { BUNGIE_CLIENT_ID, BUNGIE_CLIENT_SECRET } = process.env;

if (!BUNGIE_CLIENT_ID)
  throw new Error(
    "BUNGIE_CLIENT_ID environment variable must be defined. See README.md"
  );
if (!BUNGIE_CLIENT_SECRET)
  throw new Error(
    "BUNGIE_CLIENT_SECRET environment variable must be defined. See README.md"
  );

const authSettings = {
  client_id: BUNGIE_CLIENT_ID,
  client_secret: BUNGIE_CLIENT_SECRET,
};

export async function getAccessToken() {
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
