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
    port: 5432,
});

function faillingId(id){
    return Number.isNaN(Number(id)) ||  id % 1 !== 0 || typeof id === typeof Boolean()
}

function faillingMessage(message){
    return message !== undefined  && typeof message != typeof String()
}

function faillingDone(done){
    return done !== undefined && typeof done != typeof Boolean()
}
/**
 * @status      => 500
 * @message     => "Erreur serveur"
 * @data        => undefined
 */
class Responcer {
    constructor(conf = {}) {
        this.status = conf.status       ||  500
        this.message = conf.message     ||  "Erreur serveur"
        this.data = conf.status         ||  undefined
    }

    statusStr(){
        return (200 <= this.status && this.status <300) ? "SUCCESS" : "FAIL"
    }

    send(response){
        return response.status(this.status).json({
            status: this.statusStr(),
            message: this.message,
            data: this.data
        })
    }

    info(){
        return `${this.status} | ${this.statusStr()}\n${this.message}`
    }
}


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
app.get('/api/users', async (req , res) => 
{
    let rpcr = new Responcer()

    try 
    {
        const data = await client.query('SELECT id, username FROM users');
        
        rpcr.status = 200 ;
        rpcr.message = `Récupération de ${data.rowCount} utilisateurs` ;
        rpcr.data = data.rows ;
        
    }
    catch (err) 
    {
        console.log(err.stack);
    }
    console.log(`get | /api/users | ${rpcr.info()}`);
    res = rpcr.send(res)
})

// Récupération des Tickets
app.get('/api/tickets', async (req, res) => 
{
    let rpcr = new Responcer()
    
    try 
    {
        const data = await client.query('SELECT * FROM tickets');

        rpcr.status = 200 ;
        rpcr.message = `Récupération de ${data.rowCount} tickets` ;
        rpcr.data = data.rows ;
    }
    catch (err) 
    {
        console.log(err.stack)
    }
    console.log(`get | /api/tickets | ${rpcr.info()}`);
    res = rpcr.send(res)
})


// Récupération d'un Ticket avec son id
app.get('/api/tickets/:id', async (req, res) => 
{
    let rpcr = new Responcer()
    const id = req.params.id
    
    // Vérifiction du Type de l'id entrante
    if (faillingId(id))
    {
        rpcr.status = 400 ;
        rpcr.message = `${id} n'est pas un nombre entier` ;
    } 
    else 
    {
        try 
        {
            const data = await client.query('SELECT * FROM tickets WHERE id=$1', [id]);
    
            // Vérifiction de l'existence de l'id
            if (data.rows.length === 1) {
                
                rpcr.status = 200 ;
                rpcr.message = `Récupération du ticket ${id}` ;
                rpcr.data = data.rows[0] ;

            } else {
                rpcr.status = 404 ;
                rpcr.message = `Le ticket ${id} n'existe pas` ;
            }
        }
        catch (err) 
        {
            console.log(err.stack)
        }
    }
    console.log(`get | /api/tickets/${id} | ${rpcr.info()}`);
    res = rpcr.send(res)
})


// Création d'un Ticket
app.post('/api/tickets', async (req, res) => 
{
    let rpcr = new Responcer()
    const { user_id, message} = req.body;

    // Vérifiction du Type du user_id entrant
    if (faillingId(user_id))
    {
        rpcr.status = 400 ;
        rpcr.message = `${user_id} n'est pas un nombre entier` ;
    } 
    else if (faillingMessage(message))
    {
        rpcr.status = 400 ;
        rpcr.message = `${message} n'est pas un texte` ;
    } 
    else 
    {
        try 
        {
            // Vérifiction de la presence des paramètres nécessaires
            if (message !== undefined  && user_id !== undefined ) 
            {
                const usersList = await client.query('SELECT id FROM users WHERE id = $1',[user_id]);

                // Vérifiction de l'existence du user_id
                if (usersList.rowCount === 1)
                {
                    const data = await client.query('INSERT INTO tickets (message, user_id) VALUES ($1,$2) RETURNING *', [message, user_id]);

                    rpcr.status = 201 ;
                    rpcr.message = `Création du ticket ${data.rows[0].id}` ;
                    rpcr.data = data.rows[0] ;
                } 
                else 
                {
                    rpcr.status = 404 ;
                    rpcr.message = `L'utilisateur ${user_id} n'existe pas` ;
                }
            } 
            else 
            {
                rpcr.status = 400 ;
                rpcr.message = "Structure incorrect : { message : string , user_id : number }" ;
            }
        }
        catch (err) 
        {
            console.log(err.stack)
        }
    }
    console.log(`post | /api/tickets | ${rpcr.info()}`);
    res = rpcr.send(res)
})

// Modification d'un Ticket
app.put('/api/tickets', async (req, res) => 
{
    let rpcr = new Responcer()
    const { id, message, done} = req.body;

    // Vérifiction de la presence des paramètres nécessaires
    if (!(id !== undefined && (message !== undefined || done !== undefined))) 
    {
        rpcr.status = 400 ;
        rpcr.message = "Structure incorrect : { id : number , message : string , done : boolean } ou { id : number , message : string } ou  { id : number , done : boolean }" ;
    }
    // Vérifiction du Type de l'id entrante
    else if (faillingId(id))
    {
        rpcr.status = 400 ;
        rpcr.message = `${id} n'est pas un nombre entier` ;
    }
    // Vérifiction du Type du message entrant
    else if (faillingMessage(message))
    {
        rpcr.status = 400 ;
        rpcr.message = `${message} n'est pas un texte` ;
    }

    // Vérifiction du Type du done entrant
    else if (faillingDone(done))
    {
        rpcr.status = 400 ;
        rpcr.message = `${done} n'est pas un booleen` ;
    }
    else {

        try 
        {
            let data
            
            // Exécution de la bonne requête en fonction des paramètres
            if (message !== undefined && done !== undefined) 
            {
                data = await client.query('UPDATE tickets SET message = $1, done = $2 WHERE id = $3 RETURNING *', [message, done, id]);
            } 
            else if (message !== undefined)
            {
                data = await client.query('UPDATE tickets SET message = $1 WHERE id = $2 RETURNING *', [message, id]);
            } 
            else 
            {
                data = await client.query('UPDATE tickets SET done = $1 WHERE id = $2 RETURNING *', [done, id]);
            }
    
            // Vérifiction de l'existence de l'id
            if (data.rowCount > 0) 
            {
                rpcr.status = 200 ;
                rpcr.message = `Le ticket ${id} a bien été modifier` ;
                rpcr.data = data.rows[0] ;
            } 
            else 
            {
                rpcr.status = 404 ;
                rpcr.message = `Le ticket ${id} n'existe pas` ;
            }
        }
        catch (err) 
        {
            console.log(err.stack)
        }
    }
    console.log(`put | /api/tickets | ${rpcr.info()}`);
    res = rpcr.send(res)
})

// Suppression d'un Ticket
app.delete('/api/tickets/:id', async (req, res) => 
{
    let rpcr = new Responcer()
    const id = req.params.id;

    // Vérifiction du Type de l'id entrante
    if (faillingId(id))
    {
        rpcr.status = 400 ;
        rpcr.message = `${id} n'est pas un nombre entier` ;
    }
    else 
    {
        try 
        {
            const data = await client.query('DELETE FROM tickets WHERE id = $1', [id]);
            
            // Vérifiction de l'existence de l'id
            if (data.rowCount === 1) 
            {
                rpcr.status = 200 ;
                rpcr.message = `Le ticket ${id} a bien été supprimé` ;
            } 
            else 
            {
                rpcr.status = 404 ;
                rpcr.message = `Aucune ticket ne correspond à l'id ${id}` ;
            }
        }
        catch (err) 
        {
            console.log(err.stack);
        }
    }
    console.log(`delete | /api/tickets/${id} | ${rpcr.info()}`);
    res = rpcr.send(res)
})

app.all('*', async (req, res) => 
{
    let rpcr = new Responcer({
        status : 404,
        message : `Cette requête n'existe pas`
    })
    console.log(`* | ${rpcr.info()}`);
    console.log(req);
    res = rpcr.send(res)
});

// ecoute le port 8000
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})

















