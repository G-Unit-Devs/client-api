import { User, Messages } from "./models/index.js";
import { io, server } from "./utils/server.js";

User.watch().on('change', (payload) => {
    console.log(payload.operationType);
});
Messages.watch().on('change', console.log);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));