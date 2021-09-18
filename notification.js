const fs = require('fs');
const {twilio_sid, twilio_token, twilio_phone_number} = JSON.parse(fs.readFileSync('keys.json', {encoding:'utf8', flag:'r'}));

const client = require('twilio')(twilio_sid, twilio_token);

async function sendSms(numberString, text) {
	await client.messages.create({
		body: text,
		from: twilio_phone_number,
		to: numberString,
	});
}