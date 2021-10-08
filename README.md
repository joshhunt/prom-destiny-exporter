# Destiny Promethetheus Exporter

Scrapes the Destiny API and reports metrics to be scraped with Prometheus.

Requires:

- NodeJS (tested with v14.17.0)
- Bungie developer application
- Destiny membership authorized with OAuth
- This does not strictly require it, but you probably want to run Prometheus to scrape this

## Setup

### 1. Create config file

1. Copy `.env.sample` to `.env`
2. Fill in the `DESTINY_MEMBERSHIP_*` values with your Destiny membership type and membership ID.

### 2. Create a Bungie developer application

1.  Sign into Bungie.net
2.  Visit https://bungie.net/en/Application and Create New App
3.  Set OAuth Client Type to Confidential
4.  Set Redirect URL to `https://paracausal.science/oauth/`
5.  Set Origin Header to `https://paracausal.science`
6.  Hit save
7.  Take note of the client_id, client_secret, and API Key and fill their values in `.env`

### 3. Create OAuth credentials

1. Visit https://paracausal.science/oauth/
2. You have already completed steps 1-7 on this page in the previous step so just fill in the `client_id` and `client_secret` and click the link
3. You will need to authorize the login on Bungie.net, and you will be redirected back to paracausal.science/oauth/
4. Copy the `oauth token` (the JSON object containing `access_token`) and put it in a `auth.json` file in the root of this repository

### 4. Run the exporter!

1. Install dependencies with `yarn install`
2. Run the exporter with `yarn start`
3. Visit http://localhost:9991/metrics - it should display metrics in the Prometheus format

### 5. Configure Prometheus to scrape at your desired interval

This will be up to you, but it shouldn't be too involved. Scrape interval of more than 1 minute is probably not required as the Bungie API has heavy caching and new data would not be returned any more frequently.
