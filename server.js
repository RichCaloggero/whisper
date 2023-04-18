import fs from "fs";
import path from "path";
import {Readable} from "stream";
import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import https from "https";
import { Configuration, OpenAIApi } from "openai";

const app = express();
const port = 3000;
const configuration = new Configuration({
apiKey: process.env.OPENAI_API_KEY,
});
const AI = new OpenAIApi(configuration);

const httpsServer = https.createServer({
key: fs.readFileSync("server.key"),
cert: fs.readFileSync("server.cert"),
requestCertificate: false,
rejectUnauthorized: false // only for self-signed; do not use in production
}, app);

httpsServer.listen(port, () => {
console.log(`https server Listening on port ${port}`);
});

//app.use(express.json()) // for parsing application/json
app.use(express.raw({type: "audio/mpeg", limit: "25mb"}));

app.get("/:name", (req, res) => {
res.sendFile(req.params.name, {
root: path.join(process.cwd(), "html")
});
});

app.post("/", async (req, res) => {
const buffer = req.body;
console.log("buffer: ", buffer.length);
fs.writeFileSync("foo.mp3", buffer);

try {

const transcription = await AI.createTranscription(fs.createReadStream("foo.mp3"), "whisper-1");


if (transcription.data?.text) {
res.json({text: transcription.data.text});
console.log("text: ", transcription.data.text);
} // if

} catch(error) {
if (error.response) {
console.error(error.response.status, error.response.data);
} else if (error.message) {
console.error(`Error with OpenAI API request: ${error.message}`);
} else {
console.error(error);
} // if

res.sendStatus(500);
} // try

return;
}); // post




/*// these routes allow routing requests to destinations outside the server root
Object.keys(extraRoutes).forEach(_path => {

const r = new RegExp("/" + escapeRegExp(_path) + "/(.*)");
app.get(r, (req,res, next) => {
const directory = extraRoutes[_path];
if (not(directory)) {
next();
return;
} // if

//console.log("sending: ", path.join(directory, req.params[0]));
sendFile(directory, req, res, next);
});
}); // forEach extraRoute
*/
