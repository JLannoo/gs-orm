import { GSORM } from "./GSORM";
import { GSORMModel } from "./GSORM/Model";

const gsorm = new GSORM({
	spreadsheetId: "15P4CMvCUOEeHxMMIJ6RH97vHRKCyittmljN5byRplEI",
	credentialsPath: "./credentials.json",
});

async function main() {
	const UserModel = new GSORMModel("User", {
		name: String,
		age: Number,
	});

	const PostModel = new GSORMModel("Post", {
		title: String,
		content: String,
	});

	await gsorm.authenticate();

	await gsorm.registerModel(UserModel);
	await gsorm.registerModel(PostModel);

	await gsorm.insert(UserModel, {
		name: "Test",
		age: 18,
	});

	await gsorm.insert(PostModel, {
		title: "Hello World!",
		content: "This is a test post!",
	});
}

main();