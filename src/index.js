import connnectDb from "./db/db.js";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config()




connnectDb()
.then(()=>{
    app.listen(process.env.PORT || 3000,()=>console.log(`App running on port ${process.env.PORT}`))
})
.catch((err)=>{
    console.log('MONGODB connnection failed !!',err)
})