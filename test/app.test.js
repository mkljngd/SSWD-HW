const chai = require("chai");
const chaiHttp = require("chai-http");
const request = require("supertest");
const app = require("../app");
const { expect } = chai;

chai.use(chaiHttp);

describe("API Endpoints", () => {
  it("should render the welcome screen", (done) => {
    chai
      .request(app)
      .get("/")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include("Welcome");
        done();
      });
  });

  it("should create a new patient and load the intake form", (done) => {
    chai
      .request(app)
      .get("/intake")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include("Patient Intake Form");
        done();
      });
  });

  it("should handle missing patientId gracefully", async () => {
    const res = await request(app).get("/intake");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Patient Intake Form");
  });

  it("should update health questions for the patient", async () => {
    const res = await request(app)
      .post("/health-questions")
      .send({ patientId: 1, grayHair: "Yes", brokenBone: "No", tripOver: "Yes" });
    expect(res.statusCode).toEqual(302); // Redirect after submission
  });

  it("should return 404 for an invalid patientId", async () => {
    const res = await request(app).get("/insurance?patientId=99999");
    expect(res.statusCode).toEqual(404);
  });
});