const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const bcrypt =  require("bcryptjs")

const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
    PORT = 3000, 
    SESS_NAME = 'sid', 
    SESS_SECRET = 'salkfjgl sakf u', 
    NODE_ENV = 'development',
    SESS_LIFETIME = TWO_HOURS,
} = process.env

const IN_PROD = NODE_ENV === 'production'

const app =  express();

app.use(bodyParser.urlencoded({
    extended:true
}))

const users = []

app.use(session({
    name: SESS_NAME,
    resave: false, 
    saveUninitialized : false,
    secret: SESS_SECRET,
    cookie: {
        maxAge : SESS_LIFETIME,
        sameSite : true,
        secure : IN_PROD
    }
}))

const redirectLogin = (req, res, next) =>{
    if(!req.session.userId){
        res.redirect('/login')
    }else{
        next()
    }
}

const redirectHome = (req, res, next) =>{
    if(req.session.userId){
        res.redirect('/home')
    }else{
        next()
    }
}

app.get('/', (req, res) =>{
    const {userId} = req.session
    res.json(users)
    res.send(
       ` <h1>Welcome</h1>
       ${userId ? `
       <a href = '/home'>Home</a>
       <form method ='post' action = '/logout'>
           <button>Logout</button>
       `: `
       <a href='/login'>Login</a>
       <a href = '/register'>Register</a>
       `} 
        </form>`
    )
})

app.get('/home', redirectLogin, (req, res) =>{
    const user = users.find(user => user.id === req.session.userId)
    res.send(`
        <h1>home</h1>
        <a href = '/'>Main</a>
        <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
        </ul>
    `)

})

app.get('/login', redirectHome, (req, res) =>{
    res.send(` <h1>Login</h1>
    <form method = 'post' action = '/login'>
        <input type= 'email' name = 'email' placeholder = 'email' required/>
        <input type= 'password' name = 'password' placeholder = 'password' required/>
        <input type= 'submit' />
    </form>
        <a href = '/register'>Register</a>
    `)
})

app.get('/register',redirectHome, (req, res) =>{
    res.send(`
    <h1>Register</h1>
    <form method = 'post' action = '/register'>
        <input type= 'text' name = 'name' placeholder = 'someone' required />
        <input type= 'email' name = 'email' placeholder = 'email' required/>
        <input type= 'password' name = 'password' placeholder = 'password' required/>
        <input type= 'submit' />
    </form>
    <a href = '/login'>Login</a>
    `)
})

app.post('/login',redirectHome, async (req, res) =>{
            const {email, password} = req.body
            if(email && password){
                        const user = users.find(user => user.email = email)
                    if(user&&email === user.email){
                        try{
                            if( await bcrypt.compare(password, user.password)){
                                res.send('Success')
                            }else{
                                res.send('Not Allowed')
                            }
                        }catch(err){
                            res.status(500).send()
                        }
                     }
                    }
            else{
                res.redirect('/login')
            }
            
})

app.post('/register',redirectHome, async (req, res) =>{
    const {name, email, password} = req.body

    if(name && email && password){
        const exists = users.some(
            user=> user.email === email )

            if(!exists){

                try{
                    const salt = await bcrypt.genSalt()
                    const hashedPassword = await bcrypt.hash(req.body.password, salt)
                    const user = {
                        id: users.length + 1,
                        name,
                        email,
                        hashedPassword
                    }
                  users.push(user)
                  res.status(201).send()
                }
                catch{
                    res.status(500).send()
                }
                req.session.userId = user.id

                return res.redirect('/home')
            }
        
    }
    res.redirect('/register') // TODO:  /register? error = error.auth.emailTooShort
})


app.post('/logout',redirectLogin, (req, res) =>{
req.session.destroy(err =>{
    if(err){
        return res.redirect('/home')
    }

    res.clearCookie(SESS_NAME)
    res.redirect('/login')
})
})

 app.listen(PORT, () => console.log(`http://localhost: ${PORT}`))