# Ticket Api

## DOC

### Users

#### GET :
 
```/api/users```

Recupération des Users

### Tickets

#### GET :
 
```/api/tickets```

Récupération des Tickets
 
```/api/tickets/{id}```

Récupération d'un Ticket avec son id

#### POST 
 
```/api/tickets```

Création d'un Ticket

body : ```{ message : string , user_id : number }```

#### PUT 
 
```/api/tickets```

Modification d'un Ticket

body : ```{ id : number , message : string , done : boolean }```

body : ```{ id : number , message : string }```

body : ```{ id : number , done : boolean }```

#### DELETE 
 
```/api/tickets/{id}```

Suppression d'un Ticket




