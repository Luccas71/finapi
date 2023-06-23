const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const custumers = [];

// verificando se a conta exsite
function verifyIfAccountExistsCPF(req, res, next) {
  const { cpf } = req.headers;

  // validando se customer existe
  const custumer = custumers.find((custumer) => custumer.cpf === cpf);

  if (!custumer) {
    return res.status(400).json({ error: "Customer not found!" });
  }

  req.custumer = custumer;

  return next();
}

// fazendo o balanço
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

// criando a conta
app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  // validação de cpf
  const costumerAlreadyExists = custumers.some(
    (custumer) => custumer.cpf === cpf
  );
  if (costumerAlreadyExists) {
    return res.status(400).json({ error: "Custumer already exists!" });
  }

  custumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

// verificando statement
app.get("/statement", verifyIfAccountExistsCPF, (req, res) => {
  const { custumer } = req;
  return res.json(custumer.statement);
});

// fazendo deposito
app.post("/deposit", verifyIfAccountExistsCPF, (req, res) => {
  const { description, amount } = req.body;

  const { custumer } = req;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };

  custumer.statement.push(statementOperation);

  return res.status(201).send();
});

// fazendo saque
app.post("/withdraw", verifyIfAccountExistsCPF, (req, res) => {
  const { amount } = req.body;
  const { custumer } = req;

  const balance = getBalance(custumer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient founds!" });
  }
  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  custumer.statement.push(statementOperation);

  return res.status(201).send();
});

app.listen(3000);
