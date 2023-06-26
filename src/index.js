const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

// verificando se a conta exsite
function verifyIfAccountExistsCPF(req, res, next) {
  const { cpf } = req.headers;

  // validando se customer existe
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Customer not found!" });
  }

  req.customer = customer;

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
  const costumerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );
  if (costumerAlreadyExists) {
    return res.status(400).json({ error: "customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

// verificando statement
app.get("/statement", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

// fazendo deposito
app.post("/deposit", verifyIfAccountExistsCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// fazendo saque
app.post("/withdraw", verifyIfAccountExistsCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient founds!" });
  }
  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// buscando extrato por data
app.get("/statement/date", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const formatDate = new Date(date + " 00:00");
  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === new Date(formatDate).toDateString()
  );

  return res.json(statement);
});

// obter dados da conta
app.get("/account", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

// atualizar dados da conta
app.put("/account", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;
  const { name } = req.body;

  customer.name = name;

  return res.status(201).send();
});

// remover a conta
app.delete("/account", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

// mostrar balanço
app.get("/balance", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }));
});

app.listen(3000);
