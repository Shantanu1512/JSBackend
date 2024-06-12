import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        console.log(process.env.MONGODB_URI);
        const connectionIstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MONGODB Connected !! HOST Name: ${connectionIstance.connection.host}`);
    } catch (error) {
        console.log("ERROR connect MONGODB ", error);
        process.exit(1);
    }
}

export default connectDB