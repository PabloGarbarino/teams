require('dotenv').config();
const { Router } = require("express")
const router = new Router();
const mysql = require('mysql');
const cookieParser = require('cookie-parser')

router.use(cookieParser());

//ds
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

conn.connect((err) => {
    if (err) throw err;
    console.log('Database Running');
})

//Rutas

//Login
router.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('home_vista');
    } else {
        res.render('login');
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie("idUsuario");
    res.render('login');
})

router.post('/auth', function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    console.log(username + " - " + password);
    if (username && password) {
        conn.query('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.cookie("idUsuario", results[0].idUsuario);
                response.redirect('/home');
            } else {
                request.session.loggedin = false;
                response.redirect('/');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

//Home
router.get('/home', (req, res) => {
    let sql = "SELECT * FROM equipos e INNER JOIN equipos_usuarios eq ON e.idEquipo=eq.idEquipo INNER JOIN usuarios u ON eq.idUsuario = u.idUsuario WHERE u.idUsuario=" + req.cookies.idUsuario;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.render('home_vista', {
            results: results
        })
    });
})

router.get('/getUserTeams', (req, res) => {
    let sql = "SELECT * FROM equipos e INNER JOIN equipos_usuarios eq ON e.idEquipo=eq.idEquipo INNER JOIN usuarios u ON eq.idUsuario = u.idUsuario WHERE u.idUsuario=" + req.cookies.idUsuario;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
})

//Integrantes
router.get('/integrantes', (req, res) => {
    let sql = "SELECT * FROM integrantes";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.render('integrantes_vista', {
            results: results
        })
    });
})

router.get('/getintegrantes', (req, res) => {
    let sql = "SELECT * FROM integrantes";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
})

router.post('/save', (req, res) => {
    let data = { nombre: req.body.nombre, apellido: req.body.apellido, puesto: req.body.puesto };
    let sql = "INSERT INTO integrantes SET ?";
    let query = conn.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/integrantes');
    });
})

//UPDATE integrante
router.post('/update', (req, res) => {
    let sql = "UPDATE integrantes SET nombre='" + req.body.nombre + "', apellido='" + req.body.apellido + "', puesto='" + req.body.puesto + "' WHERE idIntegrante=" + req.body.idIntegrante;

    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        console.log("ID user edit: " + req.body.idIntegrante);
        res.redirect('/integrantes');
    });
});

//DELETE integrante
router.post('/delete', (req, res) => {
    let sql = "DELETE FROM equipos_integrantes WHERE idIntegrante=" + req.body.idIntegrante + "";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        sql = "DELETE FROM integrantes WHERE idIntegrante=" + req.body.idIntegrante + "";
        query = conn.query(sql, (err, results) => {
            if (err) throw err;
            res.redirect('/integrantes');
        });
    });
});

//Equipos
router.get('/equipos', (req, res) => {
    let sql = "SELECT * FROM equipos";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.render('equipos_vista', {
            results: results
        })
    });
})

router.get('/getequipos', (req, res) => {
    let sql = "SELECT * FROM equipos";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results)
    });
})

router.post('/save_team', (req, res) => {
    console.log(req.body)
    let data = { nombre: req.body.nombre, comienzo: req.body.comienzo };
    let sql = "INSERT INTO equipos SET ?";
    let query = conn.query(sql, data, (err, results) => {
        if (err) throw err;
        let idEquipo = results.insertId;
        const data_final = { idEquipo: idEquipo, integrantes: req.body.integrantes }
        console.log(data_final);
        for (var i = 0; i < data_final.integrantes.length; i++) {
            sql = "INSERT INTO equipos_integrantes (idEquipo, idIntegrante) VALUES (" + data_final.idEquipo + ", " + data_final.integrantes[i] + ")";
            query = conn.query(sql, (err, results) => {
                if (err) throw err;
            });
        }
        res.redirect('/equipos');
    });
})

router.post('/update_team', (req, res) => {
    let sql = "UPDATE equipos SET nombre='" + req.body.nombre + "', comienzo='" + req.body.comienzo + "' WHERE idEquipo=" + req.body.idEquipo;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        console.log("ID team edit: " + req.body.idEquipo);
        res.redirect('/equipos');
    });
});

router.post('/delete_team', (req, res) => {
    //Equipo - Integrantes
    const idEquipo = req.body.idEquipo;
    let sql = "DELETE FROM equipos_integrantes WHERE idEquipo=" + idEquipo;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        //Equipo - Usuario
        sql = "DELETE FROM equipos_usuarios WHERE idEquipo=" + idEquipo;
        query = conn.query(sql, (err, results) => {
            //Equipo
            sql = "DELETE FROM equipos WHERE idEquipo=" + idEquipo;
            query = conn.query(sql, (err, results) => {
                if (err) throw err;
                console.log("ID team delete: " + idEquipo);
                res.redirect('/equipos');
            });
        });
    });
});

//Usuarios
router.get('/users', (req, res) => {
    let sql = "SELECT * FROM usuarios";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.render('usuarios_vista', {
            results: results
        })
    });
})

router.post('/save_user', (req, res) => {
    let data = { username: req.body.username, password: req.body.password, ROOT: req.body.ROOT };
    let sql = "INSERT INTO usuarios SET ?";
    let idUsuario;
    let query = conn.query(sql, data, (err, results) => {
        if (err) throw err;
        idUsuario = results.insertId;
        const data_final = { idUsuario: idUsuario, equipos: req.body.equipos }
        console.log(data_final);
        for (var i = 0; i < data_final.equipos.length; i++) {
            sql = "INSERT INTO equipos_usuarios (idUsuario, idEquipo) VALUES (" + data_final.idUsuario + ", " + data_final.equipos[i] + ")";
            query = conn.query(sql, (err, results) => {
                if (err) throw err;
            });
        }
        res.redirect('/users');
    });
});

router.post('/update_user', (req, res) => {
    let sql = "UPDATE usuarios SET username='" + req.body.username + "', password='" + req.body.password + "', ROOT='" + req.body.ROOT + "' WHERE idUsuario=" + req.body.idUsuario;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        console.log("ID user edit: " + req.body.idUsuario);
        res.redirect('/users');
    });
});

router.post('/delete_user', (req, res) => {
    let sql = "DELETE FROM equipos_usuarios WHERE idUsuario=" + req.body.idUsuario;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        sql = "DELETE FROM usuarios WHERE idUsuario=" + req.body.idUsuario;
        query = conn.query(sql, (err, results) => {
            if (err) throw err;
            console.log("ID user delete: " + req.body.idUsuario);
            res.redirect('/users');
        });
    });
});


//Permisos
//USUARIO - EQUIPO
router.get('/add_user_teams/:id', (req, res) => {
    var id = req.params.id;
    console.log('User id: ' + id);
    let sql = "SELECT * from equipos e WHERE idEquipo NOT IN(SELECT idEquipo FROM equipos_usuarios eq WHERE eq.idUsuario=" + req.params.id + ")";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results)
    });
})

router.get('/remove_user_teams/:id', (req, res) => {
    var id = req.params.id;
    console.log('User id: ' + id);
    let sql = "SELECT * from equipos e WHERE idEquipo IN(SELECT idEquipo FROM equipos_usuarios eq WHERE eq.idUsuario=" + req.params.id + ")";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results)
    });
})

router.post('/add_permisos_user', (req, res) => {
    let data = { equipos: req.body.equipos, idUsuario: req.body.idUsuario };
    for (var i = 0; i < data.equipos.length; i++) {
        sql = "INSERT INTO equipos_usuarios (idUsuario, idEquipo) VALUES (" + data.idUsuario + ", " + data.equipos[i] + ")";
        query = conn.query(sql, (err, results) => {
            if (err) throw err;
        });
    }
    res.redirect('/users');
});

router.post('/remove_permisos_user', (req, res) => {
    let data = { equipos: req.body.equipos, idUsuario: req.body.idUsuario };
    for (var i = 0; i < data.equipos.length; i++) {
        sql = "DELETE FROM equipos_usuarios WHERE idUsuario=" + data.idUsuario + " AND idEquipo=" + data.equipos[i];
        query = conn.query(sql, (err, results) => {
            if (err) throw err;
        });
    }
    res.redirect('/users');
});

//EQUIPO - INTEGRANTES
router.get('/add_integrante_teams/:id', (req, res) => {
    var id = req.params.id;
    console.log('Team id: ' + id);
    let sql = "SELECT * from integrantes i WHERE idIntegrante NOT IN (SELECT idIntegrante FROM equipos_integrantes ei WHERE ei.idEquipo=" + req.params.id + ")";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results)
    });
})

router.get('/remove_integrante_teams/:id', (req, res) => {
    var id = req.params.id;
    console.log('Team id: ' + id);
    let sql = "SELECT * from integrantes i WHERE idIntegrante IN (SELECT idIntegrante FROM equipos_integrantes ei WHERE ei.idEquipo=" + req.params.id + ")";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results)
    });
})

router.post('/add_integrantes_equipos', (req, res) => {
    let data = { integrantes: req.body.integrantes, idEquipo: req.body.idEquipo };
    console.log(data);
    for (var i = 0; i < data.integrantes.length; i++) {
        sql = "INSERT INTO equipos_integrantes (idEquipo, idIntegrante) VALUES (" + data.idEquipo + ", " + data.integrantes[i] + ")";
        query = conn.query(sql, (err, results) => {
            if (err) throw err;
        });
    }
    res.redirect('/equipos');
});

router.post('/remove_integrantes_equipos', (req, res) => {
    let data = { integrantes: req.body.integrantes, idEquipo: req.body.idEquipo };
    console.log(data);
    for (var i = 0; i < data.integrantes.length; i++) {
        sql = "DELETE FROM equipos_integrantes WHERE idEquipo=" + data.idEquipo + " AND idIntegrante=" + data.integrantes[i];
        query = conn.query(sql, (err, results) => {
            if (err) throw err;
        });
    }
    res.redirect('/equipos');
});
module.exports = router;