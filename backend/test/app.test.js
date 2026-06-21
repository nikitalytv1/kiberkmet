const request = require("supertest");
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("OK");
});

test("GET / returns OK", async () => {
  const res = await request(app).get("/");
  expect(res.text).toBe("OK");
});