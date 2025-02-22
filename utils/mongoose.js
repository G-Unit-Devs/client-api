import "dotenv/config";
import mongoose from 'mongoose';

const { MONGODB_APP_NAME, MONGODB_DB_URL, MONGODB_DB_USER, MONGODB_DB_PASSWORD } = process.env;
const MONGODB_TEMPLATE_STRING = `mongodb+srv://${MONGODB_DB_USER}:${MONGODB_DB_PASSWORD}@${MONGODB_DB_URL}/g-unit-devs?retryWrites=true&w=majority&appName=${MONGODB_APP_NAME}`;

try {
    await mongoose.connect(MONGODB_TEMPLATE_STRING);
} catch (error) {
    console.error(error);
}

export default mongoose;