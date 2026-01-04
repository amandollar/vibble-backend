import 'dotenv/config';
import connnectDb from "./db/db.js";
import { app } from "./app.js";




connnectDb()
.then(()=>{
    app.listen(process.env.PORT || 3000,()=>console.log(`App running on port ${process.env.PORT}`))
})
.catch((err)=>{
    console.log('MONGODB connnection failed !!',err)
})