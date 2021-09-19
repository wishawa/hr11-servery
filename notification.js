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

async function formatAndSend(information) {
	const {lunch, dinner, name, number} = information;
	const [lunch1, lunch2] = lunch.slice(0, 2);
	const [dinner1, dinner2] = dinner.slice(0, 2);
	const text =
	`Good morning ${name.split(" ")[0]}! ${(new Date()).toLocaleDateString()}.
	
	----Lunch----
	${lunch1.servery}: ${lunch1.info.foods.join(", ")}.
	${lunch2.servery}: ${lunch2.info.foods.join(", ")}.
	
	----Dinner----
	${dinner1.servery}: ${dinner1.info.foods.join(", ")}.
	${dinner2.servery}: ${dinner2.info.foods.join(", ")}.
	
	-Thanks for using Servery Hacks!
	`;
	await sendSms(number, text);
}

module.exports = {
	formatAndSend,
}