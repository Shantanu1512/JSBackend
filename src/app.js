import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()

//This will hold all the necessary methods from express in app
// const app = express()

//This will help for cross origin resource sharing, will provide origin and accept credentials with more options.
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))

//This will help to accept data coming in json format to store on our server with 16kb initial size.
app.use(express.json({
    limit: "16kb",
}))

//This will help in accepting data coming from url and will handle.
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

//This will help in storing file or folders on server.
app.use(express.static("public"))

//This will help in using crud operation on browser cookies that server can manage, server will access and set cookies on users browser
app.use(cookieParser())

 
//routes importing 

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"

//declaring routes
/*
before we used to write app.get("/route")
but now we have separated wvwerything in separate files
so we are now using middlewares to declare routes
*/ 

app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRouter)


export { app }

