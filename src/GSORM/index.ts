import path from "node:path";
import { google, sheets_v4 } from "googleapis";
import type { GoogleAuth, JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { GSORMModel } from "./Model";

type GSORMOptions = {
    spreadsheetId: string;
    credentialsPath: string;
};

export class GSORM {
	private auth?: GoogleAuth<JSONClient>;
	private sheets?: sheets_v4.Sheets;
    
	private spreadsheetId: string;
	private credentialsPath: string;

	constructor(options: GSORMOptions) {
		this.spreadsheetId = options.spreadsheetId;
		this.credentialsPath = path.resolve(options.credentialsPath);
	}

	async authenticate() {
		this.auth = new google.auth.GoogleAuth({
			keyFile: this.credentialsPath,
			scopes: [ "https://www.googleapis.com/auth/spreadsheets" ],
		});

		this.sheets = google.sheets({ version: "v4", auth: this.auth });
	}

	async getSheet(sheetName: string) {
		try {
			const sheet = await this.sheets?.spreadsheets.values.get({
				spreadsheetId: this.spreadsheetId,
				range: `${sheetName}!A1:Z`,
			});

			return sheet;
		} catch (error) {
			return null;
		}
	}

	async registerModel<T>(model: GSORMModel<T>) {
		// Check if sheet already exists
		const sheet = await this.getSheet(model.name);
		
		// Check if schema matches
		if (sheet) {
			const sheetHeader = sheet.data.values?.[0] ?? [];
			const modelHeader = Object.keys(model.schema);

			const schemaUpToDate = modelHeader.every((header) => sheetHeader.includes(header));
			if (schemaUpToDate) {
				console.log(`Schema for ${model.name} is up to date!`);
				return;
			}

			// Update schema
			const response = await this.sheets?.spreadsheets.values.update({
				spreadsheetId: this.spreadsheetId,
				range: `${model.name}!A1`,
				valueInputOption: "RAW",
				requestBody: {
					values: [ modelHeader ],
				},
			});

			console.log(`Schema for ${model.name} updated!`);
			

			return response;
		}

		// Create new sheet for model
		await this.sheets?.spreadsheets.batchUpdate({
			spreadsheetId: this.spreadsheetId,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: {
								title: model.name,
							},
						},
					},
				],
			},
		});

		// Create header row
		const headerRow = Object.keys(model);
		await this.sheets?.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `${model.name}!A1`,
			valueInputOption: "RAW",
			requestBody: {
				values: [ headerRow ],
			},
		});

		console.log(`Created sheet for ${model.name}!`);
	}

	// insert function with generic that infers the type of the model
	async insert<T>(model: GSORMModel<T>, data: T) {
		// Check if sheet exists
		const sheet = await this.getSheet(model.name);
		if (!sheet) throw new Error(`Sheet ${model.name} does not exist!`);

		// Check if schema matches
		const sheetHeader = sheet.data.values?.[0] ?? [];
		const modelHeader = Object.keys(model.schema);

		const schemaMatch = modelHeader.every((header) => sheetHeader.includes(header));
		if (!schemaMatch) throw new Error(`Schema for ${model.name} does not match!`);

		// Insert data
		const values = Object.values(data);
		await this.sheets?.spreadsheets.values.append({
			spreadsheetId: this.spreadsheetId,
			range: `${model.name}!A1`,
			valueInputOption: "RAW",
			requestBody: {
				values: [ values ],
			},
		});
	}
}