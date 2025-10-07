const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const filePath = "./employees.json";
const apiKeys = [];

// Load existing employees
let employees = fs.existsSync(filePath)
  ? JSON.parse(fs.readFileSync(filePath, "utf8"))
  : [
      {
        id: crypto.randomUUID(),
        name: "Alice",
        salary: 50000,
        position: "Developer",
        addedBy: "IT",
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Bob",
        salary: 60000,
        position: "Manager",
        addedBy: "HR",
        createdAt: new Date(),
      },
    ];

function saveEmployees() {
  fs.writeFileSync(filePath, JSON.stringify(employees, null, 2));
}

// 🧠 Generate API key
app.post("/generate-key", (req, res) => {
  const { department } = req.body;
  const apiKey = crypto.randomBytes(16).toString("hex");
  const newKey = { department, apiKey, createdAt: new Date() };
  apiKeys.push(newKey);
  res.json(newKey);
});

// Get all keys
app.get("/keys", (req, res) => {
  res.json(apiKeys);
});

// Validate key
app.post("/validate", (req, res) => {
  const { apiKey } = req.body;
  const found = apiKeys.find((k) => k.apiKey === apiKey);
  if (found) res.json({ valid: true, department: found.department });
  else res.status(401).json({ valid: false, message: "Invalid API key" });
});

// ✅ Auth middleware
function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const valid = apiKeys.find((k) => k.apiKey === apiKey);
  if (!valid) return res.status(401).json({ message: "Invalid or missing API key" });
  req.department = valid.department;
  next();
}

// 📄 Get all employees
app.get("/employees", authenticate, (req, res) => {
  res.json(employees);
});

// ➕ Add new employee (FIXED)
app.post("/employees", authenticate, (req, res) => {
  const { name, salary, position } = req.body;

  const newEmployee = {
    id: crypto.randomUUID(),
    name,
    salary,
    position,
    addedBy: req.department,
    createdAt: new Date(),
  };

  employees.push(newEmployee);
  saveEmployees();

  res.json({ message: "Employee added", data: newEmployee });
});

// ✏️ Update employee
app.put("/employees/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { name, salary, position } = req.body;

  const employee = employees.find((e) => e.id === id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  employee.name = name || employee.name;
  employee.salary = salary || employee.salary;
  employee.position = position || employee.position;

  saveEmployees();

  res.json({ message: "Employee updated", data: employee });
});

// ❌ Delete employee
app.delete("/employees/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) return res.status(404).json({ message: "Employee not found" });

  const deleted = employees.splice(index, 1);
  saveEmployees();

  res.json({ message: "Employee deleted", deleted });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
