require("dotenv").config();

import express from "express";
import promClient from "prom-client";
import collectMetrics from "./collectMetrics";

const metricServer = express();

metricServer.get("/metrics", async (req, res) => {
  console.log("Metrics scraped at", new Date().toLocaleString());
  await collectMetrics();
  res.contentType("text/plain");
  res.send(await promClient.register.metrics());
});

metricServer.listen(9991, () =>
  console.log(
    `🚨 Prometheus listening on port 9991 /metrics at`,
    new Date().toLocaleString()
  )
);
