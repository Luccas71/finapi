const express = require('express');
const { v4: uuidv4} = require('uuid')

const app = express();
app.use(express.json());

const custumers = [];

// criando a conta
app.post("/account", (req, res) => {
    const { cpf, name } = req.body


    // validação de cpf
    const costumerAlreadyExists = custumers.some((custumer) => custumer.cpf === cpf)
    if(costumerAlreadyExists) {
        return res.status(400).json({error: "Custumer already exists!"})
    }

    custumers.push({
        cpf,
        name, 
        id: uuidv4(), 
        statement: []
    })

    return res.status(201).send()
});

// verificando statement
app.get("/statement/:cpf", (req, res) => {
    const { cpf } = req.params; 

    const custumer = custumers.find((custumer) => custumer.cpf === cpf);

    // validando se customer existe
    if(!custumer) {
        return res.status(400).json({error: "Customer not found!"})
    }

    return res.json(custumer.statement)
})

app.listen(3000)

