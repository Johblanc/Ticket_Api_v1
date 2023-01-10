// imports
// npm i express
// npm i body-parser


const express = require('express');
const { Client } = require('pg');
require('dotenv').config()

// declarations
const app = express();
const port = 8000;

const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME, 
    password: process.env.DB_PASSWORD,
    port: DB_PORT,
});

client.connect();

app.use(express.json());
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// ROUTES -----------------------

// Récupération des Users
app.get('/api/users', async (req , res) => {
    
    try {
        const data = await client.query('SELECT id, username FROM users');
        res.status
        res.status(200).json({
            status: "SUCCESS",
            message: `Récupération de ${data.rowCount} utilisateurs`,
            data: data.rows
        });
        console.log(`get | /api/users | 200 | SUCCESS\nRécupération de ${data.rowCount} utilisateurs`);
    }
    catch (err) {
        res.status(500).json({
            status: "FAIL",
            message: err.stack,
            data : undefined
        });
        console.log(`get | /api/users | 500 | FAIL\n${err.stack}`);
    }
})

// Récupération des Tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets');
        res.status(200).json({
            status: "SUCCESS",
            message: `Récupération de ${data.rowCount} tickets`,
            data: data.rows
        });
        console.log(`get | /api/tickets | 200 | SUCCESS\nRécupération de ${data.rowCount} tickets`);
    }
    catch (err) {
        console.log(err.stack)
        res.status(500).json({
            status: "FAIL",
            message: err.stack,
            data : undefined
        });
        console.log(`get | /api/tickets | 500 | FAIL\n${err.stack}`);
    }
})

// Récupération d'un Ticket avec son id
app.get('/api/tickets/:id', async (req, res) => {
    const id = req.params.id
    
    // Vérifiction du Type de l'id entrante
    if (
        Number.isNaN(Number(id)) || 
        id % 1 !== 0 ||
        typeof id === typeof Boolean()
    )
    {
        res.status(404).json({
            status: "FAIL",
            message: `${id} n'est pas un nombre entier`,
            data : undefined
        });
            console.log(`get | /api/tickets/${id} | 404 | FAIL\n${id} n'est pas un nombre`);
        return ;
    }

    try {
        const data = await client.query('SELECT * FROM tickets WHERE id=$1', [id]);

        // Vérifiction de l'existence de l'id
        if (data.rows.length === 1) {
            res.status(200).json({
                status: "SUCCESS",
                message: `Récupération du ticket ${id}`,
                data: data.rows[0]
            });
            console.log(`get | /api/tickets/${id} | 200 | FAIL\nRécupération du ticket ${id}`);
        } else {
            res.status(404).json({
                status: "FAIL",
                message: `Le ticket ${id} n'existe pas`,
                data : undefined
            });
            console.log(`get | /api/tickets/${id} | 404 | FAIL\nLe ticket ${id} n'existe pas`);
        }
    }
    catch (err) {
        console.log(err.stack)
        res.status(500).json({
            status: "FAIL",
            message: err.stack,
            data : undefined
        });
        console.log(`get | /api/tickets/${id} | 500 | FAIL\n${err.stack}`);
    }
})

// Création d'un Ticket
app.post('/api/tickets', async (req, res) => {
    const { user_id, message} = req.body;

    // Vérifiction du Type du user_id entrant
    if (
        Number.isNaN(Number(user_id)) || 
        user_id % 1 !== 0 ||
        typeof user_id === typeof Boolean()
    )
    {
        res.status(404).json({
            status: "FAIL",
            message: `${user_id} n'est pas un nombre entier`,
            data : undefined
        });
            console.log(`post | /api/tickets | 404 | FAIL\n${user_id} n'est pas un nombre`);
        return ;
    }

    // Vérifiction du Type du message entrant
    if (message !== undefined  && typeof message != typeof String()){
        res.status(404).json({
            status: "FAIL",
            message: `${message} n'est pas un texte`,
            data : undefined
        });
        console.log(`post | /api/tickets | 404 | FAIL\n${message} n'est pas un texte`);
        return ;
    }

    try {
        
        // Vérifiction de la presence des paramètres nécessaires
        if (message !== undefined  && user_id !== undefined ) {
            const usersList = await client.query('SELECT id FROM users WHERE id = $1',[user_id]);

            // Vérifiction de l'existence du user_id
            if (usersList.rowCount === 1){
                const data = await client.query('INSERT INTO tickets (message, user_id) VALUES ($1,$2) RETURNING *', [message, user_id]);
                res.status(201).json({
                    status: "SUCCESS",
                    message: `Création du ticket ${data.rows[0].id}`,
                    data: data.rows[0]
                });
                console.log(`post | /api/tickets | 200 | SUCCESS\nCréation du ticket ${data.rows[0].id}`);
            } else {
                res.status(400).json({
                    status: "FAIL",
                    message: `L'utilisateur ${user_id} n'existe pas`,
                    data : undefined
                });
                console.log(`post | /api/tickets | 400 | FAIL\nStructure incorrect : { message : string , user_id : number }`);
            }

        } else {
            res.status(400).json({
                status: "FAIL",
                message: "Structure incorrect : { message : string , user_id : number }",
                data : undefined
            });
            console.log(`post | /api/tickets | 400 | FAIL\nStructure incorrect : { message : string , user_id : number }`);
        }

    }
    catch (err) {
        res.status(500).json({
            status: "FAIL",
            message: err.stack,
            data : undefined
        });
        console.log(`post | /api/tickets/${id} | 500 | FAIL\n${err.stack}`);
    }
})

// Modification d'un Ticket
app.put('/api/tickets', async (req, res) => {

    const { id, message, done} = req.body;

    // Vérifiction de la presence des paramètres nécessaires
    if (!(id !== undefined && (message !== undefined || done !== undefined))) {
        res.status(400).json({
            status: "FAIL",
            message: "Structure incorrect : { id : number , message : string , done : boolean } ou { id : number , message : string } ou  { id : number , done : boolean }",
            data : undefined
        });
        console.log(`put | /api/tickets | 400 | FAIL\nStructure incorrect : { id : number , message : string , done : boolean } ou { id : number , message : string } ou  { id : number , done : boolean }`);
        return ;
    }
    // Vérifiction du Type de l'id entrante
    if (
        Number.isNaN(Number(id)) || 
        id % 1 !== 0 ||
        typeof id === typeof Boolean()
    )
    {
        res.status(404).json({
            status: "FAIL",
            message: `${id} n'est pas un nombre entier`,
            data : undefined
        });
            console.log(`put | /api/tickets | 404 | FAIL\n${id} n'est pas un nombre`);
        return ;
    }

    // Vérifiction du Type du message entrant
    if (message !== undefined && typeof message != typeof String()){
        res.status(404).json({
            status: "FAIL",
            message: `${message} n'est pas un texte`,
            data : undefined
        });
        console.log(`put | /api/tickets | 404 | FAIL\n${message} n'est pas un texte`);
        return ;
    }

    // Vérifiction du Type du done entrant
    if (done !== undefined && typeof done != typeof Boolean()){
        res.status(404).json({
            status: "FAIL",
            message: `${done} n'est pas un booleen`,
            data : undefined
        });
        console.log(`put | /api/tickets | 404 | FAIL\n${message} n'est pas un texte`);
        return ;
    }


    try {
        let data
        
        // Exécution de la bonne requête en fonction des paramètres
        if (message !== undefined && done !== undefined) {
            data = await client.query('UPDATE tickets SET message = $1, done = $2 WHERE id = $3 RETURNING *', [message, done, id]);
        } else if (message !== undefined){
            data = await client.query('UPDATE tickets SET message = $1 WHERE id = $2 RETURNING *', [message, id]);
        } else {
            data = await client.query('UPDATE tickets SET done = $1 WHERE id = $2 RETURNING *', [done, id]);
        }

        // Vérifiction de l'existence de l'id
        if (data.rowCount > 0) {
            res.status(200).json({
                status: "SUCCESS",
                message: `Le ticket ${id} a bien été modifier`,
                data: data.rows[0]
            });
            console.log(`put | /api/tickets | 200 | SUCCESS\nLe ticket ${id} a bien été modifier`);
        } else {
            res.status(400).json({
                status: "FAIL",
                message: `Le ticket ${id} n'existe pas`,
                data : undefined
            });
            console.log(`put | /api/tickets | 400 | FAIL\nLe ticket ${id} n'existe pas`);
        }
    }
    catch (err) {
        res.status(500).json({
            status: "FAIL",
            message: "Serveur introuvable",
            data : undefined
        });
        console.log(`put | /api/tickets | 500 | FAIL\n${err.stack} `);
    }
})

// Suppression d'un Ticket
app.delete('/api/tickets/:id', async (req, res) => {
    const id = req.params.id;

    // Vérifiction du Type de l'id entrante
    if (
        Number.isNaN(Number(id)) || 
        id % 1 !== 0 ||
        typeof id === typeof Boolean()
    )
    {
        res.status(404).json({
            status: "FAIL",
            message: `${id} n'est pas un nombre entier`,
            data : undefined
        });
        console.log(`delete | /api/tickets/${id} | 404 | FAIL\n${id} n'est pas un nombre`);
        return ;
    }
    try {
        const data = await client.query('DELETE FROM tickets WHERE id = $1', [id]);
        
        // Vérifiction de l'existence de l'id
        if (data.rowCount === 1) {
            res.status(200).json({
                status : "SUCCESS",
                message: `Le ticket ${id} a bien été supprimé`,
                data : undefined
            });
            console.log(`delete | /api/tickets/${id} | 200 | SUCCESS\nLe ticket ${id} a bien été supprimé`);
        } else {
            res.status(404).json({
                status: "FAIL",
                message: `Aucune ticket ne correspond à l'id ${id}`,
                data : undefined
            });
            console.log(`delete | /api/tickets/${id} | 404 | FAIL\nAucune ticket ne correspond à l'id ${id}`);
        }

    }
    catch (err) {
        res.status(500).json({
            status: "FAIL",
            message: "Serveur introuvable",
            data : undefined
        });
        console.log(`delete | /api/tickets/${id} | 500 | FAIL\n${err.stack} `);
    }
})

app.all('*', async (req, res) => {
    res.status(404).json({
        status: "FAIL",
        message: `Cette requête n'existe pas`,
        data : undefined
    });
});

// ecoute le port 8000
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})

















