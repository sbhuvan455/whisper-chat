import mongoose from 'mongoose';

export const Connect = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGO_URI)
                .then((response) => {
                    console.log("connected to database")
                    resolve(response);
                })
                .catch((err) => {
                    console.log("error connecting to database")
                    reject(err);
                })
    })
}