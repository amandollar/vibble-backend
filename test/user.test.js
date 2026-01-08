import request from "supertest";
import { app } from "../src/app.js";


describe("App Health", () => {
  it("should return health", async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});