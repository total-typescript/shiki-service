import bodyParser from "body-parser";
import express from "express";
import { v1POST } from "./server/v1/POST.js";

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Healthy!");
});

app.post("/v1", v1POST);

const start = async () => {
  app.listen(port, () =>
    console.log(`Shiki Service listening on port ${port}!`),
  );
};

start().catch(async (e) => {
  console.log(e);
  process.exit(1);
});
