const express = require("express");

const tasksRouter = require("./routes/tasks");
const { ApiError } = require("./api-error");

const app = express();

app.use(express.json());
app.use("/tasks", tasksRouter);

app.use((req, res) => {
  res.status(404).json({ error: { code: "not_found", message: "not found" } });
});

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err.status === 400) {
    return res
      .status(400)
      .json({ error: { code: "invalid_json", message: "the body is not a JSON object" } });
  }
  res.status(500).json({ error: { code: "internal_error", message: "internal error" } });
});

module.exports = app;
