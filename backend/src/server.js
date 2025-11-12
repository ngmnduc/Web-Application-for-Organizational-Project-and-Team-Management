import { connectDB } from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
