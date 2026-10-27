import { createApp } from "./app.js";
const port = Number(process.env.PORT || 3001);
const server = createApp().listen(port, "0.0.0.0", () =>
  console.log(`RealityLab API and production assets listening on port ${port}`),
);
server.requestTimeout = 120000;
server.headersTimeout = 15000;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => server.close(() => process.exit(0)));
