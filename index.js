import { User, Messages } from "./models/index.js";
import MessagesBot from "./models/MessagesBot.js";
import { io, server } from "./utils/server.js";

try {
    User.watch().on('change', (payload) => {
        switch (payload.operationType) {
            case "update":
                User.findById(payload.documentKey._id)
                    .then((user) => {
                        console.log(user);
                        io.of("/chat").emit("user/update", user);
                    });
                break;
            default:
                break;
        }
    });
    Messages.watch().on('change', console.log);
    MessagesBot.watch().on('change', (payload) => {
        switch (payload.operationType) {
            case "update":
                MessagesBot.findById(payload.documentKey._id)
                    .then((chat) => io.of("/chat").emit("chatBot/update", chat));
                break;
            default:
                break;
        }
    });
} catch (error) {
    console.error(error);
}

const PORT = process.env.PORT || 80;
server.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));