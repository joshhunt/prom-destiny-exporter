import { DestinyProfileResponse } from "bungie-api-ts/destiny2";

import { promMetricProgress } from "../metrics";

export default function collectDestinyMetrics(profile: DestinyProfileResponse) {
  for (const [metricHash, destinyMetric] of Object.entries(
    profile.metrics?.data?.metrics ?? {}
  )) {
    promMetricProgress
      .labels({ metricHash })
      .set(destinyMetric.objectiveProgress.progress ?? 0);
  }
}
