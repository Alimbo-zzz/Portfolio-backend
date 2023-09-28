const express = require('express');
const { v4: setId } = require('uuid');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const env = dotenv.config().parsed;

const shortId = () => ("0000" + ((Math.random() * Math.pow(36, 4)) | 0).toString(36)).slice(-4);

const tg_token = '6489172045:AAExVF8AhTVL_KbHU4O3KJ1jAkE9NMAr-n4';
const tg_bot = new TelegramBot(tg_token, { polling: true });
let tg_chat_id = env.TG_CHAT_ID || null;


tg_bot.on('message', msg => {
	console.log(msg);
	tg_chat_id = msg?.chat?.id;
})


const PORT = env.PORT || 2020;
const sheetURL = "https://script.google.com/macros/s/AKfycbz3kgJLy50HzuP-I_cYC7DAS67RnKvf2dEwZHCrLcZ8Gjl_j4wAyhcwjTjK6ZY0izoQ/exec";

const app = express();

app.use(cors());
app.use(fileUpload()); //позволяет получать formData в запросах
app.use(express.json()); // позволяет читать json в запросах
app.use(express.urlencoded({ extended: true }));

app.post('/send-message', async (req, res) => {
	try {
		const { phone, name, mail, message, id = shortId() } = req.body;
		if (!phone || !name) throw new Error("Передайте обязательные ключи <phone> & <name>")

		const sheet_req = await axios({
			method: 'post',
			url: sheetURL,
			params: { phone, name, mail, message, id }
		})


		if (sheet_req.status >= 400) throw new Error("Ошибка таблицы");

		if (tg_chat_id) tg_bot.sendMessage(tg_chat_id, `id: ${id}\n\nИмя: ${name}\n\nНомер: ${phone}\n\nПочта: ${mail}\n\nСообщение:\n${message}`)

		return res.status(200).json({ "message": "Сообщение успешно отправлено", data: { ...sheet_req.data } })
	} catch (error) {
		console.log(error);
		return res.status(404).json(error);
	}
})




// start server
app.listen(PORT, (err) => {
	if (err) return console.log(err);
	console.log('server started')
	console.log(`link: http://localhost:${PORT}`)
})